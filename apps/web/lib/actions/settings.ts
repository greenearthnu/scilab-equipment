"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@scilab/db";
import { isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";

const ScoreSettingsSchema = z.object({
  initialScore: z.coerce.number().int().min(1).max(100),
  minToBook: z.coerce.number().int().min(1).max(99),
  earlyReturnBonus: z.coerce.number().int().min(0).max(20),
  evidenceBonus: z.coerce.number().int().min(0).max(20),
  unlockScore: z.coerce.number().int().min(1).max(100),
});

export type ScoreSettingsFormState =
  | { message?: string; error?: string }
  | undefined;

export async function updateScoreSettings(
  _state: ScoreSettingsFormState,
  formData: FormData
): Promise<ScoreSettingsFormState> {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    return { error: "เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขการตั้งค่าได้" };
  }

  const parsed = ScoreSettingsSchema.safeParse({
    initialScore: formData.get("initialScore"),
    minToBook: formData.get("minToBook"),
    earlyReturnBonus: formData.get("earlyReturnBonus"),
    evidenceBonus: formData.get("evidenceBonus"),
    unlockScore: formData.get("unlockScore"),
  });
  if (!parsed.success) {
    return { error: "กรุณากรอกค่าให้ถูกต้อง (ตัวเลข 0–100)" };
  }

  const { initialScore, minToBook, earlyReturnBonus, evidenceBonus, unlockScore } =
    parsed.data;

  await db.scoreSettings.upsert({
    where: { id: 1 },
    update: {
      initialScore,
      minToBook,
      earlyReturnBonus,
      evidenceBonus,
      unlockScore,
      updatedById: user.id,
    },
    create: {
      id: 1,
      initialScore,
      minToBook,
      earlyReturnBonus,
      evidenceBonus,
      unlockScore,
      updatedById: user.id,
    },
  });

  await recordAudit(
    user.id,
    "SCORE_SETTINGS_UPDATE",
    "ScoreSettings",
    "1",
    `แก้ไขการตั้งค่าคะแนน: เริ่มต้น ${initialScore}, เกณฑ์ ${minToBook}, โบนัสคืน ${earlyReturnBonus}, โบนัสหลักฐาน ${evidenceBonus}, ปลดล็อก ${unlockScore}`
  );

  revalidatePath("/settings");
  revalidatePath("/users");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");

  return { message: "บันทึกการตั้งค่าเรียบร้อย" };
}
