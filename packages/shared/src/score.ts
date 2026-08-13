/** คะแนนการใช้งานสูงสุด */
export const BOOKING_SCORE_MAX = 100

/** ต่ำกว่าเกณฑ์นี้จะถูกระงับการจอง (ต้องให้ LAB_ADMIN ปลดล็อกเท่านั้น) */
export const BOOKING_SCORE_MIN_TO_BOOK = 50

/** คะแนนที่ได้เมื่อคืนเครื่องก่อนเวลาหรือตรงเวลา (อนุมัติคำขอคืน) */
export const SCORE_EARLY_RETURN_BONUS = 5

/** คะแนนที่ได้เมื่ออัปโหลดรูปหลักฐานหลังใช้งาน (จัดเก็บ/ล้างอุปกรณ์แล้ว) */
export const SCORE_EVIDENCE_BONUS = 5

/** คะแนนเมื่อถูกปลดล็อกโดยผู้ดูแล */
export const SCORE_UNLOCKED = BOOKING_SCORE_MAX

export function clampScore(value: number): number {
  return Math.max(0, Math.min(BOOKING_SCORE_MAX, value))
}

/** คะแนนต่ำกว่าเกณฑ์ → ถูกระงับการจอง */
export function isBookingLocked(score: number): boolean {
  return score < BOOKING_SCORE_MIN_TO_BOOK
}
