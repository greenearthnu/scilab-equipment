import "server-only";
import { headers } from "next/headers";
import { db } from "@scilab/db";
import {
  ROLES,
  formatBookingSummary,
  formatBookingSummaryShort,
  type BookingSummaryInfo,
} from "@scilab/shared";

const TELEGRAM_API = "https://api.telegram.org";

/** escape HTML สำหรับ parse_mode=HTML ของ Telegram (กัน user input ทำลาย layout) */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * หา base URL ของระบบเพื่อสร้างลิงก์ในข้อความ:
 * 1. APP_PUBLIC_URL (ถ้าตั้ง) — เหมาะกับ reverse proxy/tunnel
 * 2. Host / X-Forwarded-Host header ของ request ปัจจุบัน
 * 3. fallback http://localhost:3000
 */
export async function appBaseUrl(): Promise<string> {
  const configured = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  try {
    const h = await headers();
    const host =
      h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() ไม่พร้อมใช้งานในบาง context
  }
  return "http://localhost:3000";
}

/** ดึง bot token จาก env (ใช้ร่วมกันทุกฟังก์ชัน) */
function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

/** เรียก Telegram Bot API พร้อม log error ถ้าไม่สำเร็จ */
async function callTelegram(
  method: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status?: number; body?: string }> {
  const token = botToken();
  if (!token) return { ok: false };

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(
        `Telegram ${method} failed (HTTP ${res.status}):`,
        (await res.text()).slice(0, 500)
      );
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    console.error(`Telegram ${method} error:`, e);
    return { ok: false };
  }
}

/**
 * ส่งข้อความไปยัง Telegram chat
 * @param chatId ถ้าไม่ระบุ ใช้ TELEGRAM_CHAT_ID จาก env (กลุ่มผู้ดูแล/ระบบ)
 * ถ้าไม่ได้ตั้ง TELEGRAM_BOT_TOKEN / chatId → ข้ามไปเงียบ ๆ (เหมือน SMTP/email ที่ไม่บังคับ)
 */
export async function sendTelegramMessage(
  text: string,
  chatId?: string | number
): Promise<void> {
  const target = chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!botToken() || !target) return;
  await callTelegram("sendMessage", {
    chat_id: target,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

/** ปุ่ม inline keyboard — แบบ callback (กดแล้วระบบรับ) หรือแบบ URL (เปิดลิงก์) */
export type TelegramInlineButton =
  | { text: string; callbackData: string }
  | { text: string; url: string };

/**
 * Telegram อนุญาตปุ่ม URL เฉพาะ https:// หรือ t.me (http:// ธรรมดาถูกปฏิเสธด้วย
 * "Wrong HTTP URL" — รวมถึง http://localhost ใน dev) → ถ้า URL ไม่เข้าเกณฑ์ จะข้ามปุ่ม
 * และใช้ลิงก์ <a> ในข้อความแทน (ลิงก์ข้อความไม่มีข้อจำกัดนี้)
 */
function canUseUrlButton(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://t.me/");
}

/**
 * ส่งข้อความพร้อมปุ่ม inline keyboard (เช่น อนุมัติ/ปฏิเสธ, เปิดรายละเอียด)
 * - callbackData: ปุ่มที่ webhook/poller จัดการได้ (ต้องขึ้นต้นด้วย prefix ที่รู้จัก)
 * - url: ปุ่มลิงก์เปิดหน้าเว็บ (deep link) — Telegram เปิดใน browser ทันที
 */
export async function sendTelegramMessageWithButtons(
  text: string,
  buttons: TelegramInlineButton[],
  chatId?: string | number
): Promise<void> {
  const target = chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!botToken() || !target) return;
  await callTelegram("sendMessage", {
    chat_id: target,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        buttons.map((b) =>
          "url" in b
            ? { text: b.text, url: b.url }
            : { text: b.text, callback_data: b.callbackData }
        ),
      ],
    },
  });
}

/** ตอบ callback query (ไล่การ "loading" ที่ปุ่ม) พร้อมข้อความ */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

/** แก้ไขข้อความเดิม (เช่น เปลี่ยนปุ่มเป็น "อนุมัติแล้ว" หลังกด) */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  removeKeyboard = true
): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(removeKeyboard ? { reply_markup: { inline_keyboard: [] } } : {}),
  });
}

/** รูปแบบการสรุป Telegram — 'full' (หลายบรรทัด) หรือ 'short' (1-2 บรรทัด) */
export type TelegramAlertStyle = "full" | "short";

/**
 * เลือกรูปแบบสรุป: ค่าของผู้ใช้ (telegramAlertStyle) → env TELEGRAM_MESSAGE_STYLE → "full"
 */
function resolveAlertStyle(userStyle?: string | null): TelegramAlertStyle {
  const s = (userStyle ?? process.env.TELEGRAM_MESSAGE_STYLE ?? "full").toLowerCase();
  return s === "short" ? "short" : "full";
}

interface TelegramRecipient {
  chatId: string | number;
  style: TelegramAlertStyle;
}

/**
 * หาผู้รับข้อความ Telegram:
 * 1. ผู้ดูแล (LAB_ADMIN/OWNER) ที่ผูก telegramUserId แล้ว → ส่งถึงแชทส่วนตัวของแต่ละคน
 *    ด้วยรูปแบบที่แต่ละคนเลือก (telegramAlertStyle ?? env)
 * 2. ถ้ายังไม่มีใครผูก → ส่งไป TELEGRAM_CHAT_ID (กลุ่ม/แชทที่ตั้งใน env) ด้วยค่าเริ่มต้น
 */
async function telegramRecipients(): Promise<TelegramRecipient[]> {
  const linked = await db.user.findMany({
    where: {
      telegramUserId: { not: null },
      isActive: true,
      role: { in: [ROLES.LAB_ADMIN, ROLES.OWNER] },
    },
    select: { telegramUserId: true, telegramAlertStyle: true },
  });
  if (linked.length > 0) {
    return linked.map((u) => ({
      chatId: u.telegramUserId as string,
      style: resolveAlertStyle(u.telegramAlertStyle),
    }));
  }
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return [];
  return [{ chatId, style: resolveAlertStyle(null) }];
}

/** สร้างข้อความแจ้งเตือน (title + summary ตามสไตล์) */
function buildAlertText(title: string, body: string): string {
  return `🔬 <b>${escapeTelegramHtml(title)}</b>\n${escapeTelegramHtml(body)}`;
}

/**
 * ส่งข้อความแจ้งเตือนผู้ดูแลแบบ HTML (title หนา + เนื้อหา)
 * @param body ข้อความสำเร็จรูป (string) หรือ BookingSummaryInfo — ถ้าเป็น object
 *             จะจัดรูปแบบตามที่ผู้รับแต่ละคนเลือก (สรุปสั้น/เต็ม)
 * @param linkPath ถ้าให้มา จะต่อท้ายลิงก์ "เปิดดูในระบบ" + ปุ่ม "กดเพื่อเปิดรายละเอียด"
 *                 (deep link ไปยังหน้า booking/request ที่เจาะจง เช่น "/bookings#request-<id>")
 */
export async function sendAdminAlert(
  title: string,
  body: string | BookingSummaryInfo,
  linkPath?: string
): Promise<void> {
  const recipients = await telegramRecipients();
  if (recipients.length === 0) return;
  const base = linkPath ? await appBaseUrl() : undefined;

  for (const r of recipients) {
    const text =
      typeof body === "string"
        ? body
        : r.style === "short"
          ? formatBookingSummaryShort(body)
          : formatBookingSummary(body);
    let msg = buildAlertText(title, text);
    const buttons: TelegramInlineButton[] = [];
    if (base && linkPath) {
      const url = `${base}${linkPath}`;
      msg += `\n🔗 <a href="${url}">เปิดดูในระบบ</a>`;
      if (canUseUrlButton(url)) {
        buttons.push({ text: "กดเพื่อเปิดรายละเอียด", url });
      }
    }
    if (buttons.length > 0) {
      await sendTelegramMessageWithButtons(msg, buttons, r.chatId);
    } else {
      await sendTelegramMessage(msg, r.chatId);
    }
  }
}

/**
 * ส่งข้อความแจ้งเตือนผู้ดูแลพร้อมปุ่ม อนุมัติ/ปฏิเสธ + ปุ่มเปิดรายละเอียด
 * (สำหรับคำขอที่รอการตัดสิน) — ส่งถึงแชทของผู้ดูแลแต่ละคนตามรูปแบบที่เลือก
 */
export async function sendAdminAlertWithDecisionButtons(
  title: string,
  info: BookingSummaryInfo,
  requestId: string
): Promise<void> {
  const recipients = await telegramRecipients();
  if (recipients.length === 0) return;
  const base = await appBaseUrl();
  const url = `${base}/bookings#request-${requestId}`;

  for (const r of recipients) {
    const text =
      r.style === "short"
        ? formatBookingSummaryShort(info)
        : formatBookingSummary(info);
    let msg = buildAlertText(title, text);
    msg += `\n🔗 <a href="${url}">เปิดดูในระบบ</a>`;
    const buttons: TelegramInlineButton[] = [
      { text: "✅ อนุมัติ", callbackData: `approve:${requestId}` },
      { text: "❌ ปฏิเสธ", callbackData: `reject:${requestId}` },
    ];
    if (canUseUrlButton(url)) {
      buttons.push({ text: "กดเพื่อเปิดรายละเอียด", url });
    }
    await sendTelegramMessageWithButtons(msg, buttons, r.chatId);
  }
}
