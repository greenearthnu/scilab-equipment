"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@scilab/db";
import {
  ROLES,
  ROLE_LABELS,
  isRole,
  isAdminRole,
  canManageAdminRoles,
  type Role,
} from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { maybeNotifyScoreBelowThreshold } from "@/lib/score";
import { getScoreSettings } from "@/lib/score-settings";

/** OWNER และ LAB_ADMIN จัดการผู้ใช้ทั่วไปได้ */
async function requireUserManager() {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการผู้ใช้ได้");
  }
  return user;
}

/** เฉพาะ OWNER ที่จัดการบัญชีระดับ OWNER/LAB_ADMIN ได้ */
function requireCanManageAdmin(targetRole: Role, currentUserRole: Role) {
  if (
    (targetRole === ROLES.OWNER || targetRole === ROLES.LAB_ADMIN) &&
    !canManageAdminRoles(currentUserRole)
  ) {
    throw new Error("เฉพาะผู้ดูแลระบบ (Owner) เท่านั้นที่จัดการสิทธิ์นี้ได้");
  }
}

async function countActiveOwners() {
  return db.user.count({ where: { role: ROLES.OWNER, isActive: true } });
}

async function countActiveLabAdmins() {
  return db.user.count({ where: { role: ROLES.LAB_ADMIN, isActive: true } });
}

export async function updateUserRole(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const roleRaw = formData.get("role");

  if (!isRole(roleRaw)) {
    throw new Error("บทบาทไม่ถูกต้อง");
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  const nextRole = roleRaw as Role;
  if (target.role === nextRole) return;

  requireCanManageAdmin(target.role, currentUser.role);
  requireCanManageAdmin(nextRole, currentUser.role);

  const [activeOwners, activeLabAdmins] = await Promise.all([
    countActiveOwners(),
    countActiveLabAdmins(),
  ]);

  if (target.role === ROLES.OWNER && activeOwners <= 1) {
    throw new Error("ต้องมีผู้ดูแลระบบ (Owner) อย่างน้อย 1 คน");
  }
  if (target.role === ROLES.LAB_ADMIN && activeLabAdmins <= 1) {
    throw new Error("ต้องมีผู้ดูแลห้องแล็บอย่างน้อย 1 คน");
  }

  await db.user.update({ where: { id: userId }, data: { role: nextRole } });
  await recordAudit(
    currentUser.id,
    "ROLE_CHANGE",
    "User",
    userId,
    `${ROLE_LABELS[target.role]} → ${ROLE_LABELS[nextRole]}`
  );
  revalidatePath("/users");
}

export async function toggleUserStatus(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  if (target.id === currentUser.id) {
    throw new Error("ไม่สามารถระงับบัญชีของตนเองได้");
  }

  requireCanManageAdmin(target.role, currentUser.role);

  if (target.isActive) {
    const [activeOwners, activeLabAdmins] = await Promise.all([
      countActiveOwners(),
      countActiveLabAdmins(),
    ]);
    if (target.role === ROLES.OWNER && activeOwners <= 1) {
      throw new Error("ต้องมีผู้ดูแลระบบ (Owner) ที่เปิดใช้งานอย่างน้อย 1 คน");
    }
    if (target.role === ROLES.LAB_ADMIN && activeLabAdmins <= 1) {
      throw new Error("ต้องมีผู้ดูแลห้องแล็บที่เปิดใช้งานอย่างน้อย 1 คน");
    }
  }

  const activating = !target.isActive;
  await db.user.update({
    where: { id: userId },
    data: { isActive: activating },
  });
  await recordAudit(
    currentUser.id,
    activating ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    "User",
    userId,
    activating ? "เปิดใช้งานบัญชี" : "ระงับบัญชี"
  );
  revalidatePath("/users");
}

export async function resetUserPassword(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const newPassword = z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[a-zA-Z]/, "รหัสผ่านต้องมีตัวอักษร")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลข")
    .parse(formData.get("newPassword"));

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  // จัดการบัญชีของตนเองได้เสมอ (เช่น LAB_ADMIN ตั้งรหัสผ่านใหม่ให้ตัวเอง)
  if (target.id !== currentUser.id) {
    requireCanManageAdmin(target.role, currentUser.role);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await recordAudit(
    currentUser.id,
    "RESET_PASSWORD",
    "User",
    userId,
    `ตั้งรหัสผ่านใหม่ให้ ${target.name}`
  );
  revalidatePath("/users");
}

export async function updateUserProfile(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  // จัดการบัญชีของตนเองได้เสมอ (เช่น LAB_ADMIN แก้ไขโปรไฟล์ตัวเอง)
  if (target.id !== currentUser.id) {
    requireCanManageAdmin(target.role, currentUser.role);
  }

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

export async function deleteUser(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  if (userId === currentUser.id) {
    throw new Error("ไม่สามารถลบบัญชีของตนเองได้");
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  requireCanManageAdmin(target.role, currentUser.role);

  const [activeOwners, activeLabAdmins] = await Promise.all([
    countActiveOwners(),
    countActiveLabAdmins(),
  ]);
  if (target.role === ROLES.OWNER && activeOwners <= 1) {
    throw new Error("ต้องมีผู้ดูแลระบบ (Owner) ที่เปิดใช้งานอย่างน้อย 1 คน");
  }
  if (target.role === ROLES.LAB_ADMIN && activeLabAdmins <= 1) {
    throw new Error("ต้องมีผู้ดูแลห้องแล็บที่เปิดใช้งานอย่างน้อย 1 คน");
  }

  await db.$transaction([
    db.booking.updateMany({
      where: { approvedById: userId },
      data: { approvedById: null, approvedAt: null },
    }),
    db.bookingRequest.updateMany({
      where: { decidedById: userId },
      data: { decidedById: null, decidedAt: null },
    }),
    db.project.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    }),
    db.user.delete({ where: { id: userId } }),
  ]);
  await recordAudit(
    currentUser.id,
    "DELETE_USER",
    "User",
    userId,
    `ลบผู้ใช้ ${target.name} (${target.email})`
  );
  revalidatePath("/users");
}

export async function adjustUserScore(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const delta = z.coerce.number().int().min(-20).max(20).parse(formData.get("delta"));
  const reason = z.string().trim().max(200).optional().or(z.literal("")).parse(
    formData.get("reason") ?? ""
  );
  if (delta === 0) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  // จัดการบัญชีของตนเองได้เสมอ แต่ห้ามจัดการบัญชี OWNER/LAB_ADMIN ยกเว้น OWNER
  if (target.id !== currentUser.id) {
    requireCanManageAdmin(target.role, currentUser.role);
  }

  const nextScore = Math.max(0, Math.min(100, target.score + delta));
  const change = nextScore - target.score;
  if (change === 0) return;

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { score: nextScore } }),
    db.scoreLog.create({
      data: {
        userId,
        change,
        scoreAfter: nextScore,
        source: "MANUAL",
        reason: (reason ?? "").trim() || `ปรับคะแนนโดย ${currentUser.name}`,
        performedById: currentUser.id,
      },
    }),
  ]);

  await maybeNotifyScoreBelowThreshold(userId, target.score, nextScore);

  if (reason) {
    const isPenalty = delta < 0;
    await db.notification.create({
      data: {
        userId,
        title: isPenalty ? "คะแนนการใช้งานถูกหัก" : "คะแนนการใช้งานเพิ่มขึ้น",
        message: reason,
      },
    });
  }

  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}

export async function unlockUserBooking(formData: FormData) {
  const currentUser = await requireUserManager();

  const userId = z.string().min(1).parse(formData.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("ไม่พบผู้ใช้");

  if (target.id !== currentUser.id) {
    requireCanManageAdmin(target.role, currentUser.role);
  }

  const settings = await getScoreSettings();
  const nextScore = settings.unlockScore;
  const change = nextScore - target.score;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { score: nextScore },
    }),
    db.scoreLog.create({
      data: {
        userId,
        change,
        scoreAfter: nextScore,
        source: "UNLOCK",
        reason: `ปลดล็อกการจองโดย ${currentUser.name}`,
        performedById: currentUser.id,
      },
    }),
  ]);

  await db.notification.create({
    data: {
      userId,
      title: "ปลดล็อกการจองแล้ว",
      message: `ผู้ดูแลได้ปลดล็อกการจองของคุณแล้ว (คะแนนกลับเป็น ${nextScore} คะแนน)`,
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}
