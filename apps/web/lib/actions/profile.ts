"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@scilab/db";
import { getCurrentUser } from "@/lib/dal";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").trim(),
  className: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{9,15}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type ProfileFormState =
  | {
      errors?: {
        name?: string[];
        className?: string[];
        studentId?: string[];
        phone?: string[];
        avatar?: string[];
      };
      message?: string;
    }
  | undefined;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function updateProfile(
  state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();

  const validated = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    className: formData.get("className"),
    studentId: formData.get("studentId"),
    phone: formData.get("phone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, className, studentId, phone } = validated.data;

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!ALLOWED_TYPES.has(avatarFile.type)) {
      return {
        errors: { avatar: ["รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP"] },
      };
    }
    if (avatarFile.size > MAX_SIZE) {
      return {
        errors: { avatar: ["ขนาดไฟล์ต้องไม่เกิน 2MB"] },
      };
    }

    const ext = avatarFile.type === "image/jpeg" ? "jpg" : avatarFile.type === "image/png" ? "png" : "webp";
    const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      avatarUrl = `/uploads/avatars/${fileName}`;
    } catch {
      return { message: "ไม่สามารถบันทึกรูปโปรไฟล์ได้ กรุณาลองใหม่" };
    }
  }

  const data: {
    name: string;
    className?: string | null;
    studentId?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } = {
    name,
    className: className || null,
    studentId: studentId || null,
    phone: phone || null,
  };

  if (avatarUrl) {
    data.avatarUrl = avatarUrl;
  }

  const prevAvatar = user.avatarUrl;
  await db.user.update({ where: { id: user.id }, data });

  if (avatarUrl && prevAvatar && prevAvatar.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", prevAvatar);
    unlink(oldPath).catch(() => {});
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { message: "บันทึกข้อมูลเรียบร้อย" };
}
