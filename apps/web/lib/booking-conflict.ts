import { db } from "@scilab/db";
import { rangesOverlap, type TimeRange } from "@scilab/shared";

const ACTIVE_STATUSES = ["PENDING", "APPROVED", "CHECKED_OUT"] as const;
const ACTIVE_MAINTENANCE_STATUSES = ["SCHEDULED", "IN_PROGRESS"] as const;

export interface AvailabilityConflict {
  type: "booking" | "maintenance";
  /** id ของ booking หรือ maintenance record ที่ชน */
  id: string;
  title?: string;
  range: TimeRange;
}

/** หาความขัดแย้งทั้งหมด (การจอง + การซ่อมบำรุง) ในช่วงเวลาที่ต้องการ */
export async function findAvailabilityConflict(
  instrumentId: string,
  date: Date,
  range: TimeRange,
  excludeBookingId?: string
): Promise<AvailabilityConflict | null> {
  const [bookings, maintenance] = await Promise.all([
    db.booking.findMany({
      where: {
        instrumentId,
        date,
        status: { in: [...ACTIVE_STATUSES] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    }),
    db.maintenanceRecord.findMany({
      where: {
        instrumentId,
        date,
        status: { in: [...ACTIVE_MAINTENANCE_STATUSES] },
      },
    }),
  ]);

  for (const b of bookings) {
    const existing: TimeRange = { startTime: b.startTime, endTime: b.endTime };
    if (rangesOverlap(existing, range)) {
      return { type: "booking", id: b.id, range: existing };
    }
  }

  for (const m of maintenance) {
    const existing: TimeRange = { startTime: m.startTime, endTime: m.endTime };
    if (rangesOverlap(existing, range)) {
      return {
        type: "maintenance",
        id: m.id,
        title: m.title,
        range: existing,
      };
    }
  }

  return null;
}

/** wrapper เดิม — คืนเฉพาะการจองที่ชน (ใช้ในกรณีที่ต้องการรู้แค่ว่าชนหรือไม่) */
export async function findTimeConflict(
  instrumentId: string,
  date: Date,
  range: TimeRange,
  excludeBookingId?: string
): Promise<{ bookingId: string; range: TimeRange } | null> {
  const conflict = await findAvailabilityConflict(
    instrumentId,
    date,
    range,
    excludeBookingId
  );
  if (!conflict) return null;
  if (conflict.type === "booking") {
    return { bookingId: conflict.id, range: conflict.range };
  }
  return { bookingId: conflict.id, range: conflict.range };
}

/** ช่วงเวลาที่ไม่ว่างทั้งหมด (การจอง + ซ่อมบำรุง) สำหรับแสดงผลแบบ real-time */
export async function getTakenRanges(
  instrumentId: string,
  date: Date
): Promise<TimeRange[]> {
  const [bookings, maintenance] = await Promise.all([
    db.booking.findMany({
      where: {
        instrumentId,
        date,
        status: { in: [...ACTIVE_STATUSES] },
      },
    }),
    db.maintenanceRecord.findMany({
      where: {
        instrumentId,
        date,
        status: { in: [...ACTIVE_MAINTENANCE_STATUSES] },
      },
    }),
  ]);

  return [
    ...bookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    ...maintenance.map((m) => ({ startTime: m.startTime, endTime: m.endTime })),
  ];
}
