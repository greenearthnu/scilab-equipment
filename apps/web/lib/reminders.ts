import "server-only";
import { db } from "@scilab/db";
import { BOOKING_STATUS } from "@scilab/shared";
import { sendPushNotification } from "@/lib/push";
import { sendEmail, bookingReminderEmail } from "@/lib/email";

export function bookingStartLocalTime(booking: {
  date: Date;
  startTime: string;
}): Date {
  const [y, m, d] = [
    booking.date.getUTCFullYear(),
    booking.date.getUTCMonth(),
    booking.date.getUTCDate(),
  ];
  const [hh, mm] = booking.startTime.split(":").map(Number);
  return new Date(y, m, d, hh ?? 0, mm ?? 0);
}

/**
 * หาการจองที่ถึงเวลาต้องส่งแจ้งเตือนล่วงหน้า (ตาม reminderOffsetMinutes)
 * และส่ง push + email + notification ในแอป
 */
export async function sendDueBookingReminders(): Promise<number> {
  const now = new Date();

  const dueBookings = await db.booking.findMany({
    where: {
      status: BOOKING_STATUS.APPROVED,
      reminderOffsetMinutes: { gt: 0 },
      reminderSentAt: null,
    },
    include: {
      user: true,
      instrument: true,
    },
  });

  let sent = 0;
  for (const booking of dueBookings) {
    const offset = booking.reminderOffsetMinutes ?? 0;
    if (offset <= 0) continue;

    const start = bookingStartLocalTime(booking);
    const scheduledAt = new Date(start.getTime() - offset * 60 * 1000);

    // ส่งเมื่อถึงเวลานัดหมาย (ถ้า server ปิดไปนานเกิน 24 ชม. ข้ามไป)
    if (scheduledAt > now) continue;
    if (now.getTime() - scheduledAt.getTime() > 24 * 60 * 60 * 1000) continue;

    const title = "เตือนการจองใกล้เริ่ม";
    const message = `การจอง ${booking.instrument.name} วันที่ ${start.toLocaleDateString(
      "th-TH"
    )} เวลา ${booking.startTime} น. จะเริ่มในอีกไม่ช้า`;

    await db.$transaction([
      db.notification.create({
        data: { userId: booking.userId, title, message },
      }),
      db.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: now },
      }),
    ]);

    sendPushNotification(booking.userId, title, message);
    sendEmail(
      booking.user.email,
      title,
      bookingReminderEmail({
        studentName: booking.user.name,
        studentEmail: booking.user.email,
        instrumentName: booking.instrument.name,
        date: booking.date,
        slots: [{ startTime: booking.startTime, endTime: booking.endTime }],
        purpose: booking.purpose,
      })
    );

    sent++;
  }

  return sent;
}
