import "server-only";
import { db, ScoreLogSource } from "@scilab/db";
import {
  clampScore,
  isBookingLocked,
  BOOKING_SCORE_MAX,
  BOOKING_SCORE_MIN_TO_BOOK,
} from "@scilab/shared";
import { sendAdminAlert } from "@/lib/telegram";

export const BOOKING_LOCKED_MESSAGE = `คะแนนการใช้งานของคุณต่ำกว่าเกณฑ์ ${BOOKING_SCORE_MIN_TO_BOOK}% ระบบระงับการจองชั่วคราว กรุณาติดต่อผู้ดูแลห้องแล็บเพื่อปลดล็อก`;

export function isLockedOut(score: number): boolean {
  return isBookingLocked(score);
}

/** เหตุผลเริ่มต้นของแต่ละ source (ใช้เมื่อไม่ระบุ reason) */
export function defaultScoreReason(source: ScoreLogSource): string {
  switch (source) {
    case ScoreLogSource.EARLY_RETURN:
      return "คืนเครื่องก่อนเวลา/ตรงเวลา (ใช้งานถูกต้อง)";
    case ScoreLogSource.EVIDENCE:
      return "อัปโหลดรูปหลักฐานหลังใช้ (จัดเก็บ/ล้างอุปกรณ์แล้ว)";
    case ScoreLogSource.UNLOCK:
      return "ปลดล็อกการจองโดยผู้ดูแล";
    case ScoreLogSource.MANUAL:
    default:
      return "ปรับคะแนนการใช้งาน";
  }
}

/**
 * แจ้งผู้ดูแลผ่าน Telegram เมื่อคะแนนของผู้ใช้ข้ามต่ำกว่าเกณฑ์ (≥ เกณฑ์ → < เกณฑ์)
 * แจ้งครั้งเดียวตอนข้ามเส้น เพื่อไม่รบกวนซ้ำทุกครั้งที่หักคะแนนช่วงที่ต่ำกว่าเกณฑ์อยู่แล้ว
 * ไม่ตั้ง TELEGRAM_* → ข้ามเงียบ ๆ (เหมือน sendAdminAlert ทั่วไป)
 */
export async function maybeNotifyScoreBelowThreshold(
  userId: string,
  prevScore: number,
  nextScore: number
): Promise<void> {
  if (
    prevScore >= BOOKING_SCORE_MIN_TO_BOOK &&
    nextScore < BOOKING_SCORE_MIN_TO_BOOK
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, className: true },
    });
    if (!user) return;

    await sendAdminAlert(
      "คะแนนต่ำกว่าเกณฑ์",
      `ผู้ใช้: ${user.name}${user.className ? ` (${user.className})` : ""}\n` +
        `คะแนน: ${nextScore}/${BOOKING_SCORE_MAX} (เกณฑ์ขั้นต่ำ ${BOOKING_SCORE_MIN_TO_BOOK})\n` +
        "ระบบระงับการจองอัตโนมัติ — ต้องให้ผู้ดูแลห้องแล็บปลดล็อก",
      `/users/${userId}`
    );
  }
}

/** เพิ่ม/ลดคะแนนให้ผู้ใช้ (clamp 0-100) พร้อมบันทึกประวัติลง ScoreLog */
export async function awardScore(
  userId: string,
  points: number,
  source: ScoreLogSource = ScoreLogSource.MANUAL,
  reason: string = "",
  performedById?: string
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { score: true },
  });
  if (!user) return;

  const scoreAfter = clampScore(user.score + points);
  const change = scoreAfter - user.score;
  if (change === 0) return;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { score: scoreAfter },
    }),
    db.scoreLog.create({
      data: {
        userId,
        change,
        scoreAfter,
        source,
        reason: reason.trim() || defaultScoreReason(source),
        performedById: performedById ?? null,
      },
    }),
  ]);

  await maybeNotifyScoreBelowThreshold(userId, user.score, scoreAfter);
}
