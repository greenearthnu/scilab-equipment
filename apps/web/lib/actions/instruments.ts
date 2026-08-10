"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

const CreateInstrumentSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อเครื่องมือ").trim(),
  category: z.enum([
    "MICROSCOPE",
    "MEASURING",
    "CHEMICAL",
    "GLASSWARE",
    "ELECTRICAL",
    "OTHER",
  ]),
  description: z.string().max(1000).trim().optional(),
  totalQuantity: z.coerce.number().int().positive(),
  location: z.string().max(100).trim().optional(),
});

export type InstrumentFormState =
  | {
      errors?: {
        name?: string[];
        category?: string[];
        description?: string[];
        totalQuantity?: string[];
        location?: string[];
        image?: string[];
      };
      message?: string;
    }
  | undefined;

export async function createInstrument(
  state: InstrumentFormState,
  formData: FormData
): Promise<InstrumentFormState> {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    return { message: "เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่เพิ่มเครื่องมือได้" };
  }

  const validated = CreateInstrumentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    totalQuantity: formData.get("totalQuantity"),
    location: formData.get("location"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, category, description, totalQuantity, location } =
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
    const fileName = `instrument-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "instruments");

    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      imageUrl = `/uploads/instruments/${fileName}`;
    } catch {
      return { message: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" };
    }
  }

  await db.instrument.create({
    data: {
      name,
      category,
      description: description || null,
      totalQuantity,
      availableCount: totalQuantity,
      location: location || null,
      imageUrl: imageUrl ?? null,
    },
  });

  revalidatePath("/instruments");
  redirect("/instruments");
}

export async function setInstrumentStatus(formData: FormData) {
  const instrumentId = formData.get("instrumentId");
  const status = formData.get("status");

  if (
    typeof instrumentId !== "string" ||
    (status !== "AVAILABLE" && status !== "MAINTENANCE" && status !== "DISABLED")
  ) {
    return;
  }

  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  await db.instrument.update({
    where: { id: instrumentId },
    data: { status },
  });

  revalidatePath("/instruments");
}
