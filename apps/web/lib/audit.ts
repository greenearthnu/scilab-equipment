import "server-only";
import { db } from "@scilab/db";

/** บันทึกการกระทำสำคัญของผู้ดูแล (audit trail) — ใคร ทำอะไร กับใคร เมื่อไหร่ */
export async function recordAudit(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: string
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      details: details ?? null,
    },
  });
}
