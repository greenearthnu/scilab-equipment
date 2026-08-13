import { NextResponse } from "next/server";
import { db } from "@scilab/db";
import { isAdminRole } from "@scilab/shared";
import {
  answerCallbackQuery,
  editTelegramMessage,
} from "@/lib/telegram";
import { decideBookingRequest } from "@/lib/booking-request-service";

/**
 * Telegram webhook — รับ callback_query จากปุ่ม inline keyboard
 * (อนุมัติ/ปฏิเสธคำขอคืน-ขยายเวลาจากแชทได้เลย)
 *
 * ตั้งค่า webhook (เมื่อมี URL สาธารณะ เช่น APP_PUBLIC_URL + tunnel):
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=<APP_PUBLIC_URL>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 *
 * ถ้าไม่มี URL สาธารณะ (dev) ใช้ poller ใน lib/scheduler.ts แทน (getUpdates)
 */
export async function POST(request: Request) {
  // ตรวจ secret token (ถ้าตั้งไว้) — กันคนนอกส่ง callback ปลอม
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const update = body as {
    callback_query?: {
      id: string;
      data?: string;
      from?: { id?: number };
      message?: {
        chat?: { id?: number };
        message_id?: number;
      };
    };
  };

  const cb = update.callback_query;
  if (!cb?.id || !cb.data) {
    // ไม่ใช่ callback query — ตอบ ok ให้ Telegram ไม่ส่งซ้ำ
    return NextResponse.json({ ok: true });
  }

  const fromId = cb.from?.id;
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;

  // หาผู้กดปุ่มจาก telegramUserId
  const actor = fromId
    ? await db.user.findUnique({
        where: { telegramUserId: String(fromId) },
      })
    : null;

  if (!actor || !isAdminRole(actor.role)) {
    await answerCallbackQuery(cb.id, "เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่อนุมัติ/ปฏิเสธได้");
    return NextResponse.json({ ok: true });
  }
  if (!actor.isActive) {
    await answerCallbackQuery(cb.id, "บัญชีของคุณถูกระงับการใช้งาน");
    return NextResponse.json({ ok: true });
  }

  // callback data รูปแบบ: approve:<requestId> หรือ reject:<requestId>
  const [action, requestId] = cb.data.split(":");
  if (action !== "approve" && action !== "reject") {
    await answerCallbackQuery(cb.id, "ข้อมูลไม่ถูกต้อง");
    return NextResponse.json({ ok: true });
  }

  const approve = action === "approve";
  const result = await decideBookingRequest(actor.id, requestId, approve);

  if (!result.ok) {
    await answerCallbackQuery(cb.id, result.error);
    return NextResponse.json({ ok: true });
  }

  await answerCallbackQuery(cb.id, approve ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธแล้ว");

  // แก้ข้อความเดิม: เอาปุ่มออก + ระบุว่าใครตัดสิน
  if (chatId != null && messageId != null) {
    const label = approve ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธแล้ว";
    await editTelegramMessage(
      chatId,
      messageId,
      `${label} โดย ${actor.name}\n\n⚠️ คำขอนี้ถูกตัดสินแล้ว (ปุ่มถูกปิดใช้งาน)`
    );
  }

  return NextResponse.json({ ok: true });
}
