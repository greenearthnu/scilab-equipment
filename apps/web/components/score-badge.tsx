import { BOOKING_SCORE_MIN_TO_BOOK } from "@scilab/shared";

export function ScoreBadge({
  score,
  showLockLabel = false,
  minToBook = BOOKING_SCORE_MIN_TO_BOOK,
}: {
  score: number;
  showLockLabel?: boolean;
  /** เกณฑ์ขั้นต่ำที่ระงับการจอง — ส่งจาก settings (M38) ถ้าไม่ได้ส่งใช้ค่าเริ่มต้น */
  minToBook?: number;
}) {
  const locked = score < minToBook;
  const good = score >= minToBook + 25;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
          locked
            ? "bg-red-50 text-red-700"
            : good
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
        }`}
        title={`คะแนนการใช้งาน (เกณฑ์ขั้นต่ำ ${minToBook})`}
      >
        {score}
      </span>
      {showLockLabel && locked && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          ระงับการจอง
        </span>
      )}
    </span>
  );
}
