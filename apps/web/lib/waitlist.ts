import "server-only";
import { db } from "@scilab/db";
import { rangesOverlap, type TimeRange } from "@scilab/shared";
import { sendPushNotification } from "@/lib/push";
import { findAvailabilityConflict } from "@/lib/booking-conflict";

export async function joinWaitlist(
  userId: string,
  instrumentId: string,
  date: Date,
  range: TimeRange
): Promise<{ ok: true } | { ok: false; error: string }> {
  // เข้าคิวได้เฉพาะช่วงที่ยังถูกจอง/ซ่อมอยู่จริง — ถ้าว่างแล้วให้ไปจองเลย
  const conflict = await findAvailabilityConflict(instrumentId, date, range);
  if (!conflict) {
    return { ok: false, error: "ช่วงเวลานี้ว่างแล้ว — ไปจองได้เลย" };
  }

  const existing = await db.waitlistEntry.findFirst({
    where: {
      userId,
      instrumentId,
      date,
      startTime: range.startTime,
      endTime: range.endTime,
      status: { in: ["WAITING", "ACTIVE"] },
    },
  });
  if (existing) {
    return { ok: false, error: "คุณอยู่ในคิวรอช่วงเวลานี้อยู่แล้ว" };
  }

  await db.waitlistEntry.create({
    data: {
      userId,
      instrumentId,
      date,
      startTime: range.startTime,
      endTime: range.endTime,
    },
  });
  return { ok: true };
}

export async function cancelWaitlist(
  userId: string,
  entryId: string
): Promise<boolean> {
  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== userId) return false;
  if (entry.status !== "WAITING") return false;
  await db.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "CANCELLED" },
  });
  return true;
}

export async function getMyWaitlist(userId: string) {
  return db.waitlistEntry.findMany({
    where: { userId, status: { in: ["WAITING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    include: { instrument: { select: { id: true, name: true } } },
  });
}

/**
 * เรียกเมื่อการจองใน slot ถูกยกเลิก/ปฏิเสธ → แจ้งคนแรกในคิวรอที่รอ slot นี้
 * (เฉพาะคนที่รออยู่จริง กันแจ้งซ้ำตอน slot ยังไม่ว่าง)
 */
export async function notifyWaitlistForSlot(
  instrumentId: string,
  date: Date,
  range: TimeRange,
  excludeUserId?: string
): Promise<void> {
  const entries = await db.waitlistEntry.findMany({
    where: { instrumentId, date, status: "WAITING" },
    orderBy: { createdAt: "asc" },
  });

  for (const e of entries) {
    if (excludeUserId && e.userId === excludeUserId) continue;
    const er: TimeRange = { startTime: e.startTime, endTime: e.endTime };
    if (!rangesOverlap(er, range)) continue;

    // ตรวจว่า slot นี้ว่างจริงแล้ว (ไม่มี booking/ซ่อมอื่นชน) — กันแจ้งซ้ำ
    const stillBlocked = await findAvailabilityConflict(
      instrumentId,
      date,
      er
    );
    if (stillBlocked) continue;

    await db.waitlistEntry.update({
      where: { id: e.id },
      data: { status: "ACTIVE" },
    });

    const instrument = await db.instrument.findUnique({
      where: { id: instrumentId },
      select: { name: true },
    });
    const label = `${e.date.toLocaleDateString("th-TH")} ${e.startTime}–${e.endTime} น.`;
    const title = "🔔 เครื่องมือว่างแล้ว — รีบจอง!";
    const message = `${instrument?.name ?? "เครื่องมือ"} ช่วง ${label} ว่างแล้ว (คุณอยู่ในคิวรอ) — ไปจองได้เลย`;

    await db.notification.create({
      data: { userId: e.userId, title, message },
    });
    sendPushNotification(e.userId, title, message);

    break; // แจ้งคนแรกในคิวเท่านั้น
  }
}
