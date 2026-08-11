import "server-only";
import { sendDueBookingReminders } from "@/lib/reminders";

let started = false;
let running = false;

const REMINDER_INTERVAL_MS = 60 * 1000; // ตรวจทุก 1 นาที

/**
 * ตัวตั้งเวลาส่งแจ้งเตือนล่วงหน้า ทำงานภายใน server process
 * สำหรับ production แบบ serverless แนะนำใช้ /api/cron/reminders
 * ร่วมกับ scheduler ภายนอก (เช่น Vercel Cron)
 */
export function startReminderScheduler(): void {
  if (started) return;
  started = true;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sendDueBookingReminders();
    } catch (e) {
      console.error("Reminder scheduler error:", e);
    } finally {
      running = false;
    }
  };

  tick();
  setInterval(tick, REMINDER_INTERVAL_MS);
}
