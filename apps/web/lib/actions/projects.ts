"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

const CreateProjectSchema = z.object({
  title: z.string().min(3, "กรุณากรอกชื่อโครงงาน").trim(),
  summary: z.string().min(10, "กรุณากรอกรายละเอียดโครงงานอย่างน้อย 10 ตัวอักษร").trim(),
  studentNames: z.string().min(2, "กรุณากรอกชื่อนักเรียน").trim(),
  className: z.string().max(50).trim().optional(),
  teacherName: z.string().max(100).trim().optional(),
  award: z.string().max(150).trim().optional(),
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
        award?: string[];
        image?: string[];
      };
      message?: string;
    }
  | undefined;

export async function createProject(
  state: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    return { message: "เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่เพิ่มโครงงานได้" };
  }

  const validated = CreateProjectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    studentNames: formData.get("studentNames"),
    className: formData.get("className"),
    teacherName: formData.get("teacherName"),
    award: formData.get("award"),
    featured: formData.get("featured") === "on",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { title, summary, studentNames, className, teacherName, award, featured } =
    validated.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get("image");

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      return {
        errors: { image: ["รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP"] },
      };
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        errors: { image: ["ขนาดไฟล์ต้องไม่เกิน 5MB"] },
      };
    }

    const ext =
      imageFile.type === "image/jpeg"
        ? "jpg"
        : imageFile.type === "image/png"
          ? "png"
          : "webp";
    const fileName = `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "projects");

    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      imageUrl = `/uploads/projects/${fileName}`;
    } catch {
      return { message: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" };
    }
  }

  await db.project.create({
    data: {
      title,
      summary,
      studentNames,
      className: className || null,
      teacherName: teacherName || null,
      award: award || null,
      featured: featured ?? false,
      imageUrl: imageUrl ?? null,
      createdById: user.id,
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
  if (user.role !== ROLES.LAB_ADMIN) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

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
  if (user.role !== ROLES.LAB_ADMIN) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

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
  if (user.role !== ROLES.LAB_ADMIN) throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");

  await db.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  revalidatePath("/");
}
