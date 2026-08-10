import { db } from "@scilab/db";

const ACTIVE_STATUSES = ["PENDING", "APPROVED", "CHECKED_OUT"] as const;

export async function findSlotConflict(
  instrumentId: string,
  date: Date,
  slots: string[]
): Promise<string | null> {
  const conflicting = await db.booking.findMany({
    where: {
      instrumentId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
    },
    include: { slots: { select: { timeSlot: true } } },
  });

  const taken = new Set<string>();
  for (const b of conflicting) {
    for (const s of b.slots) taken.add(s.timeSlot);
  }

  return slots.find((s) => taken.has(s)) ?? null;
}
