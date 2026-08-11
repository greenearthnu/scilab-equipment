import { db } from "@scilab/db";
import { rangesOverlap, type TimeRange } from "@scilab/shared";

const ACTIVE_STATUSES = ["PENDING", "APPROVED", "CHECKED_OUT"] as const;

export async function findTimeConflict(
  instrumentId: string,
  date: Date,
  range: TimeRange,
  excludeBookingId?: string
): Promise<{ bookingId: string; range: TimeRange } | null> {
  const conflicting = await db.booking.findMany({
    where: {
      instrumentId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

  for (const b of conflicting) {
    const existing: TimeRange = { startTime: b.startTime, endTime: b.endTime };
    if (rangesOverlap(existing, range)) return { bookingId: b.id, range: existing };
  }

  return null;
}

export async function getTakenRanges(
  instrumentId: string,
  date: Date
): Promise<TimeRange[]> {
  const conflicting = await db.booking.findMany({
    where: {
      instrumentId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
    },
  });

  return conflicting.map((b) => ({ startTime: b.startTime, endTime: b.endTime }));
}
