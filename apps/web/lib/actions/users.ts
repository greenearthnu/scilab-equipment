"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@scilab/db";
import { ROLES, isRole, type Role } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

async function requireLabAdmin() {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่จัดการผู้ใช้ได้");
  }
  return user;
}

export async function updateUserRole(formData: FormData) {
  await requireLabAdmin();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const roleRaw = formData.get("role");

  if (!isRole(roleRaw)) {
    throw new Error("บทบาทไม่ถูกต้อง");
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  if (target.role === ROLES.LAB_ADMIN || roleRaw === ROLES.LAB_ADMIN) {
    const admins = await db.user.count({ where: { role: ROLES.LAB_ADMIN, isActive: true } });
    if (target.role === ROLES.LAB_ADMIN && admins <= 1) {
      throw new Error("ต้องมีผู้ดูแลห้องแล็บอย่างน้อย 1 คน");
    }
  }

  await db.user.update({ where: { id: userId }, data: { role: roleRaw as Role } });
  revalidatePath("/users");
}

export async function toggleUserStatus(formData: FormData) {
  const currentUser = await requireLabAdmin();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  if (target.id === currentUser.id) {
    throw new Error("ไม่สามารถระงับบัญชีของตนเองได้");
  }

  if (target.role === ROLES.LAB_ADMIN) {
    const admins = await db.user.count({
      where: { role: ROLES.LAB_ADMIN, isActive: true },
    });
    if (admins <= 1) {
      throw new Error("ต้องมีผู้ดูแลห้องแล็บที่เปิดใช้งานอย่างน้อย 1 คน");
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive: !target.isActive },
  });
  revalidatePath("/users");
}

export async function resetUserPassword(formData: FormData) {
  await requireLabAdmin();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const newPassword = z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[a-zA-Z]/, "รหัสผ่านต้องมีตัวอักษร")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลข")
    .parse(formData.get("newPassword"));

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/users");
}

export async function updateUserProfile(formData: FormData) {
  await requireLabAdmin();

  const userId = z.string().min(1).parse(formData.get("userId"));

  const schema = z.object({
    name: z.string().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").trim(),
    className: z.string().trim().optional().or(z.literal("")),
    studentId: z.string().trim().optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^[0-9+\-\s]{9,15}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
      .trim()
      .optional()
      .or(z.literal("")),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    className: formData.get("className"),
    studentId: formData.get("studentId"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.name?.[0] ?? "ข้อมูลไม่ถูกต้อง");
  }

  const { name, className, studentId, phone } = parsed.data;

  await db.user.update({
    where: { id: userId },
    data: {
      name,
      className: className || null,
      studentId: studentId || null,
      phone: phone || null,
    },
  });
  revalidatePath("/users");
}
