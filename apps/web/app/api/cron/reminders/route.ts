import { sendDueBookingReminders } from "@/lib/reminders";

/**
 * Cron endpoint สำหรับส่งแจ้งเตือนล่วงหน้า
 * ตั้ง CRON_SECRET ใน env แล้วเรียกด้วย header `Authorization: Bearer <secret>`
 * หรือ x-cron-secret: <secret>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET ไม่ได้ตั้งค่า" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const provided =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : headerSecret;

  if (provided !== secret) {
    return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const sent = await sendDueBookingReminders();
  return Response.json({ success: true, remindersSent: sent });
}
