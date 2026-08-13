"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@scilab/db";
import { AWARD_LEVELS, isAdminRole, isAwardLevel, type AwardLevel } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

const CreateProjectSchema = z.object({
  title: z.string().min(3, "กรุณากรอกชื่อโครงงาน").trim(),
  summary: z.string().min(10, "กรุณากรอกรายละเอียดโครงงานอย่างน้อย 10 ตัวอักษร").trim(),
  studentNames: z.string().min(2, "กรุณากรอกชื่อนักเรียน").trim(),
  className: z.string().min(1, "กรุณากรอกชั้นเรียน").max(50).trim(),
  teacherName: z.string().min(1, "กรุณากรอกอาจารย์ที่ปรึกษา").max(100).trim(),
  year: z.coerce
    .number()
    .int()
    .min(2000, "ปีต้องอยู่ระหว่าง 2000-2100")
    .max(2100, "ปีต้องอยู่ระหว่าง 2000-2100"),
  featured: z.coerce.boolean().optional(),
});

export type ProjectFormState =
  | {
      errors?: {
        title?: string[];
        summary?: string[];
        studentNames?: string[];
        className?: string[];
        teacherName?: string[];
        awardTitle?: string[];
        year?: string[];
        image?: string[];
      };
      message?: string;
    }
  | undefined;

export type ProjectFormData = {
  id: string;
  title: string;
  summary: string;
  studentNames: string;
  className: string;
  teacherName: string;
  year: number;
  featured: boolean;
  awards: { id: string; title: string; level: AwardLevel }[];
  images: { id: string; url: string }[];
};

function parseAwards(formData: FormData): { title: string; level: AwardLevel }[] {
  const titles = (formData.getAll("awardTitle") as string[]).map((t) => t.trim());
  const levels = (formData.getAll("awardLevel") as string[]).map((l) => l.trim());

  const awards: { title: string; level: AwardLevel }[] = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    if (!title) continue;
    let level: AwardLevel = AWARD_LEVELS.OTHER;
    const candidate = levels[i];
    if (candidate && isAwardLevel(candidate)) {
      level = candidate;
    }
    awards.push({ title, level });
  }
  return awards;
}

async function saveImageFiles(
  files: File[],
  startOrder: number
): Promise<
  | { ok: true; images: { url: string; displayOrder: number }[] }
  | { ok: false; message: string }
> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" };
  }

  const saved: { url: string; displayOrder: number }[] = [];
  for (const [index, imageFile] of files.entries()) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      return { ok: false, message: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP" };
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return { ok: false, message: "แต่ละภาพต้องมีขนาดไม่เกิน 5MB" };
    }

    const ext =
      imageFile.type === "image/jpeg"
        ? "jpg"
        : imageFile.type === "image/png"
          ? "png"
          : "webp";
    const fileName = `project-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
    } catch {
      return { ok: false, message: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" };
    }

    saved.push({ url: `/uploads/projects/${fileName}`, displayOrder: startOrder + index });
  }

  return { ok: true, images: saved };
}

export async function createProject(
  state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    return { message: "เฉพาะผู้ดูแลระบบเท่านั้นที่เพิ่มโครงงานได้" };
  }

  const validated = CreateProjectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    studentNames: formData.get("studentNames"),
    className: formData.get("className"),
    teacherName: formData.get("teacherName"),
    year: formData.get("year"),
    featured: formData.get("featured") === "on",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const awards = parseAwards(formData);
  if (awards.some((a) => a.title.length > 150)) {
    return {
      errors: { awardTitle: ["ชื่อรางวัลยาวเกิน 150 ตัวอักษร"] },
    };
  }

  const { title, summary, studentNames, className, teacherName, year, featured } =
    validated.data;

  const imageFiles = formData.getAll("images").filter(
    (f): f is File => f instanceof File && f.size > 0
  );

  if (imageFiles.length === 0) {
    return { errors: { image: ["กรุณาอัปโหลดรูปโครงงานอย่างน้อย 1 ภาพ"] } };
  }
  if (imageFiles.length > 3) {
    return { errors: { image: ["อัปโหลดรูปได้สูงสุด 3 ภาพ"] } };
  }

  const saveResult = await saveImageFiles(imageFiles, 0);
  if (!saveResult.ok) {
    return { message: saveResult.message };
  }

  await db.project.create({
    data: {
      title,
      summary,
      studentNames,
      className,
      teacherName,
      year,
      featured: featured ?? false,
      createdById: user.id,
      awards: {
        create: awards.map((a) => ({ title: a.title, level: a.level, year })),
      },
      images: {
        create: saveResult.images,
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function updateProject(
  projectId: string,
  state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    return { message: "เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขโครงงานได้" };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { images: true },
  });
  if (!project) {
    return { message: "ไม่พบโครงงานนี้ในระบบ" };
  }

  const validated = CreateProjectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    studentNames: formData.get("studentNames"),
    className: formData.get("className"),
    teacherName: formData.get("teacherName"),
    year: formData.get("year"),
    featured: formData.get("featured") === "on",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const awards = parseAwards(formData);
  if (awards.some((a) => a.title.length > 150)) {
    return {
      errors: { awardTitle: ["ชื่อรางวัลยาวเกิน 150 ตัวอักษร"] },
    };
  }

  const { title, summary, studentNames, className, teacherName, year, featured } =
    validated.data;

  const removeImageIds = (formData.getAll("removeImageId") as string[]).filter(Boolean);
  const keptImages = project.images.filter((img) => !removeImageIds.includes(img.id));
  const newFiles = formData.getAll("images").filter(
    (f): f is File => f instanceof File && f.size > 0
  );

  const totalImages = keptImages.length + newFiles.length;
  if (totalImages === 0) {
    return { errors: { image: ["กรุณาใส่รูปโครงงานอย่างน้อย 1 ภาพ"] } };
  }
  if (totalImages > 3) {
    return { errors: { image: ["อัปโหลดรูปได้สูงสุด 3 ภาพ (รวมรูปเดิม)"] } };
  }

  if (removeImageIds.length > 0) {
    await db.projectImage.deleteMany({
      where: { id: { in: removeImageIds }, projectId },
    });
  }

  if (newFiles.length > 0) {
    const saveResult = await saveImageFiles(newFiles, keptImages.length);
    if (!saveResult.ok) {
      return { message: saveResult.message };
    }
    await db.projectImage.createMany({
      data: saveResult.images.map((img) => ({ ...img, projectId })),
    });
  }

  await db.projectAward.deleteMany({ where: { projectId } });
  await db.projectAward.createMany({
    data: awards.map((a) => ({ title: a.title, level: a.level, year, projectId })),
  });

  await db.project.update({
    where: { id: projectId },
    data: {
      title,
      summary,
      studentNames,
      className,
      teacherName,
      year,
      featured: featured ?? false,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/projects");
}

export async function setProjectPublished(formData: FormData) {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return;

  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  await db.project.update({
    where: { id: projectId },
    data: { published: !project.published },
  });

  revalidatePath("/projects");
  revalidatePath("/");
}

export async function setProjectFeatured(formData: FormData) {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return;

  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  await db.project.update({
    where: { id: projectId },
    data: { featured: !project.featured },
  });

  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deleteProject(formData: FormData) {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string") return;

  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

  await db.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  revalidatePath("/");
}
