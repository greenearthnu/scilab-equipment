import type { BookingRecurrence } from "@scilab/db";

/** จำนวนครั้งสูงสุดต่อรอบการจองซ้ำ (กันสร้างหนังสือเกิน) */
export const RECURRENCE_MAX_INSTANCES = 12;

/**
 * สร้างรายการวันที่สำหรับจองซ้ำ:
 * - NONE → [start]
 * - WEEKLY → +7 วัน ต่อเนื่อง
 * - MONTHLY → +1 เดือน (วันเดียวกันของเดือน ถ้าเดือนสั้นกว่าจะใช้วันสุดท้ายของเดือน)
 * หยุดเมื่อเกิน end หรือครบ RECURRENCE_MAX_INSTANCES
 */
export function recurrenceDates(
  start: Date,
  recurrence: BookingRecurrence,
  end: Date
): Date[] {
  if (recurrence === "NONE") return [new Date(start)];

  const dates: Date[] = [];
  let d = new Date(start);
  while (d <= end && dates.length < RECURRENCE_MAX_INSTANCES) {
    dates.push(new Date(d));
    if (recurrence === "WEEKLY") {
      d.setDate(d.getDate() + 7);
    } else {
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      const lastDay = new Date(y, m + 1, 0).getDate();
      d = new Date(y, m + 1, Math.min(day, lastDay));
    }
  }
  return dates;
}

/** วันที่สิ้นสุดการจองซ้ำ (ถ้าไม่ระบุ ใช้ค่าเริ่มต้นตามจำนวนครั้งสูงสุด) */
export function defaultRecurrenceEnd(
  start: Date,
  recurrence: BookingRecurrence
): Date {
  const d = new Date(start);
  if (recurrence === "WEEKLY") {
    d.setDate(d.getDate() + 7 * (RECURRENCE_MAX_INSTANCES - 1));
  } else {
    d.setMonth(d.getMonth() + RECURRENCE_MAX_INSTANCES - 1);
  }
  return d;
}
