import { isBookingLocked, BOOKING_SCORE_MIN_TO_BOOK } from "@scilab/shared";

export function ScoreBadge({
  score,
  showLockLabel = false,
}: {
  score: number;
  showLockLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
          isBookingLocked(score)
            ? "bg-red-50 text-red-700"
            : score >= 75
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
        }`}
        title={`คะแนนการใช้งาน (เกณฑ์ขั้นต่ำ ${BOOKING_SCORE_MIN_TO_BOOK})`}
      >
        {score}
      </span>
      {showLockLabel && isBookingLocked(score) && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
          ระงับการจอง
        </span>
      )}
    </span>
  );
}
