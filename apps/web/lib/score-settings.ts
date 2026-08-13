import "server-only";
import { cache } from "react";
import { db } from "@scilab/db";
import {
  BOOKING_SCORE_MAX,
  BOOKING_SCORE_MIN_TO_BOOK,
  SCORE_EARLY_RETURN_BONUS,
  SCORE_EVIDENCE_BONUS,
  SCORE_UNLOCKED,
} from "@scilab/shared";

export interface ScoreSettings {
  /** คะแนนเริ่มต้นของผู้ใช้ใหม่ (ค่าเริ่มต้น 100) */
  initialScore: number;
  /** ต่ำกว่าเกณฑ์นี้ → ระงับการจอง (ค่าเริ่มต้น 50) */
  minToBook: number;
  /** คะแนนที่ได้เมื่อคืนเครื่องก่อนเวลา/ตรงเวลา (ค่าเริ่มต้น 5) */
  earlyReturnBonus: number;
  /** คะแนนที่ได้เมื่ออัปโหลดรูปหลักฐานหลังใช้ (ค่าเริ่มต้น 5) */
  evidenceBonus: number;
  /** คะแนนเมื่อถูกปลดล็อกโดยผู้ดูแล (ค่าเริ่มต้น 100) */
  unlockScore: number;
}

export const DEFAULT_SCORE_SETTINGS: ScoreSettings = {
  initialScore: BOOKING_SCORE_MAX,
  minToBook: BOOKING_SCORE_MIN_TO_BOOK,
  earlyReturnBonus: SCORE_EARLY_RETURN_BONUS,
  evidenceBonus: SCORE_EVIDENCE_BONUS,
  unlockScore: SCORE_UNLOCKED,
};

/** อ่านการตั้งค่าคะแนนจาก DB (แถวเดียว id=1) — ถ้ายังไม่มีใช้ค่าเริ่มต้น */
export const getScoreSettings = cache(async (): Promise<ScoreSettings> => {
  const row = await db.scoreSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_SCORE_SETTINGS;
  return {
    initialScore: row.initialScore,
    minToBook: row.minToBook,
    earlyReturnBonus: row.earlyReturnBonus,
    evidenceBonus: row.evidenceBonus,
    unlockScore: row.unlockScore,
  };
});
