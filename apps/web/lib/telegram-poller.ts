import "server-only";
import { db } from "@scilab/db";
import { isAdminRole } from "@scilab/shared";
import {
  answerCallbackQuery,
  editTelegramMessage,
} from "@/lib/telegram";
import { decideBookingRequest } from "@/lib/booking-request-service";

const TELEGRAM_API = "https://api.telegram.org";
const POLL_INTERVAL_MS = 5 * 1000;

let started = false;
let offset = 0;
let polling = false;

/** ตรวจว่า webhook ถูกตั้งไว้หรือยัง — ถ้าใช่ไม่ต้อง poller (กัน double-processing) */
async function webhookActive(): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return true; // ไม่ได้ตั้ง bot → ไม่ต้อง poll
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getWebhookInfo`);
    const data = (await res.json()) as { result?: { url?: string } };
    return Boolean(data.result?.url);
  } catch {
    return true;
  }
}

/** ตรวจ secret token ฝั่ง Telegram (webhook) — poller ใช้ getUpdates แทน จึงไม่ต้องตรวจ */
function isAdminActor(actor: {
  role: string;
  isActive: boolean;
}): boolean {
  return isAdminRole(actor.role as never) && actor.isActive;
}

/**
 * ดึง callback_query จาก getUpdates แล้วประมวลผล (อนุมัติ/ปฏิเสธ)
 * ทำงานทุก POLL_INTERVAL_MS — ใช้ใน dev ที่ไม่มี URL สาธารณะสำหรับ webhook
 */
export async function pollTelegramUpdates(): Promise<void> {
  if (started) return;
  started = true;

  const loop = async () => {
    if (polling) return;
    if (await webhookActive()) return; // มี webhook แล้ว — ไม่ poller ซ้ำ

    polling = true;
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) return;
      const res = await fetch(
        `${TELEGRAM_API}/bot${token}/getUpdates?timeout=25&offset=${offset}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        result?: Array<{
          update_id: number;
          callback_query?: {
            id: string;
            data?: string;
            from?: { id?: number };
            message?: {
              chat?: { id?: number };
              message_id?: number;
            };
          };
        }>;
      };

      for (const update of data.result ?? []) {
        offset = update.update_id + 1;
        const cb = update.callback_query;
        if (!cb?.id || !cb.data) continue;

        const fromId = cb.from?.id;
        const chatId = cb.message?.chat?.id;
        const messageId = cb.message?.message_id;

        const actor = fromId
          ? await db.user.findUnique({
              where: { telegramUserId: String(fromId) },
            })
          : null;

        if (!actor || !isAdminActor(actor)) {
          await answerCallbackQuery(
            cb.id,
            "เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่อนุมัติ/ปฏิเสธได้"
          );
          continue;
        }

        const [action, requestId] = cb.data.split(":");
        if (action !== "approve" && action !== "reject") {
          await answerCallbackQuery(cb.id, "ข้อมูลไม่ถูกต้อง");
          continue;
        }

        const approve = action === "approve";
        const result = await decideBookingRequest(
          actor.id,
          requestId,
          approve
        );

        if (!result.ok) {
          await answerCallbackQuery(cb.id, result.error);
          continue;
        }

        await answerCallbackQuery(
          cb.id,
          approve ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธแล้ว"
        );

        if (chatId != null && messageId != null) {
          const label = approve ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธแล้ว";
          await editTelegramMessage(
            chatId,
            messageId,
            `${label} โดย ${actor.name}\n\n⚠️ คำขอนี้ถูกตัดสินแล้ว (ปุ่มถูกปิดใช้งาน)`
          );
        }
      }
    } catch (e) {
      console.error("Telegram poller error:", e);
    } finally {
      polling = false;
      setTimeout(loop, POLL_INTERVAL_MS);
    }
  };

  loop();
}
