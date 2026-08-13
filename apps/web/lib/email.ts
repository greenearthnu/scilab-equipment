import "server-only";
import nodemailer from "nodemailer";
import { db } from "@scilab/db";
import {
  formatDateThai,
  formatTimeRanges,
  formatBookingSummary,
  type TimeRange,
} from "@scilab/shared";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "SciLab Booking <no-reply@scilab.local>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER
        ? { user: SMTP_USER, pass: SMTP_PASS ?? "" }
        : undefined,
    });
  }
  return transporter;
}

/**
 * ส่งอีเมลผ่าน SMTP
 * ถ้าไม่ได้ตั้ง SMTP_HOST จะข้ามไปเงียบ ๆ (ไม่ผิดพลาด)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transport = getTransporter();
  if (!transport) return;

  try {
    await transport.sendMail({ from: EMAIL_FROM, to, subject, html });
  } catch (e) {
    console.error("Failed to send email:", e);
  }
}

export async function sendEmailToRole(
  role: string,
  subject: string,
  html: string
): Promise<void> {
  const users = await db.user.findMany({
    where: { role: role as never, isActive: true },
    select: { email: true },
  });
  const emails = users.map((u) => u.email);
  if (emails.length === 0) return;
  await sendEmail(emails.join(","), subject, html);
}

export interface BookingEmailData {
  studentName: string;
  studentEmail: string;
  instrumentName: string;
  date: Date;
  slots: TimeRange[];
  purpose?: string | null;
  /** คะแนนการใช้งานของผู้ขอ (ใช้ในอีเมลแจ้งเตือนผู้ดูแล) */
  studentScore?: number | null;
  /** ห้องเรียนของผู้ขอ (ใช้ในอีเมลแจ้งเตือนผู้ดูแล) */
  className?: string | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Sarabun',-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background-color:#059669;padding:20px 24px;">
              <p style="margin:0;color:#ffffff;font-size:16px;font-weight:bold;">🔬 SciLab Booking</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;color:#0f172a;">${title}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์ — อีเมลฉบับนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function bookingSummary(data: BookingEmailData): string {
  const purpose = data.purpose?.trim();
  return `
    <p style="margin:0 0 8px 0;font-size:15px;color:#334155;line-height:1.6;">${data.studentName}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;padding:12px 16px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:4px 0;color:#64748b;font-size:13px;width:90px;">เครื่องมือ</td>
        <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${data.instrumentName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#64748b;font-size:13px;">วันที่</td>
        <td style="padding:4px 0;color:#0f172a;font-size:14px;">${formatDateThai(data.date)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#64748b;font-size:13px;">ช่วงเวลา</td>
        <td style="padding:4px 0;color:#0f172a;font-size:14px;">${formatTimeRanges(data.slots)}</td>
      </tr>
      ${purpose ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px;">วัตถุประสงค์</td><td style="padding:4px 0;color:#0f172a;font-size:14px;">${purpose}</td></tr>` : ""}
      ${data.studentScore != null ? `<tr><td style="padding:4px 0;color:#64748b;font-size:13px;">คะแนนการใช้งาน</td><td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;">${data.studentScore}</td></tr>` : ""}
    </table>`;
}

/**
 * สรุปข้อมูลการจองในอีเมล — ใช้ฟังก์ชันกลาง formatBookingSummary (เดียวกับ Telegram)
 * เพื่อให้ผู้ดูแลเห็นข้อมูล/รูปแบบเดียวกันทุกช่องทาง
 */
function adminBookingSummaryHtml(
  data: BookingEmailData,
  actionNote?: string
): string {
  const text = formatBookingSummary({
    studentName: data.studentName,
    studentScore: data.studentScore,
    className: data.className,
    instrumentName: data.instrumentName,
    date: data.date,
    startTime: data.slots[0]?.startTime ?? "",
    endTime: data.slots[0]?.endTime ?? "",
    purpose: data.purpose,
    actionNote,
  });
  return `
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:14px;color:#334155;line-height:1.7;white-space:pre-line;">${escapeHtml(text)}</div>`;
}

export function bookingRequestEmail(data: BookingEmailData): string {
  return baseLayout(
    "มีคำขอจองเครื่องมือใหม่",
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      นักเรียน <strong>${escapeHtml(data.studentName)}</strong> (${escapeHtml(data.studentEmail)}) ส่งคำขอจองเครื่องมือ รอการอนุมัติ
    </p>
    ${adminBookingSummaryHtml(data, "ขอจองเครื่องมือ")}`
  );
}

export function bookingDecisionEmail(
  data: BookingEmailData,
  approved: boolean
): string {
  const title = approved
    ? "คำขอจองเครื่องมือได้รับการอนุมัติ"
    : "คำขอจองเครื่องมือถูกปฏิเสธ";
  const badgeColor = approved ? "#059669" : "#dc2626";
  return baseLayout(
    title,
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      ผลการพิจารณาคำขอจองของคุณ:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:${badgeColor};color:#ffffff;font-size:14px;font-weight:600;border-radius:999px;padding:8px 20px;">
          ${approved ? "✓ อนุมัติแล้ว" : "✕ ถูกปฏิเสธ"}
        </td>
      </tr>
    </table>
    ${bookingSummary(data)}`
  );
}

export function bookingCheckedInEmail(data: BookingEmailData): string {
  return baseLayout(
    "เช็คอินสำเร็จ",
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      เครื่องมือของคุณถูกเช็คอินแล้ว ยืมได้เลย:
    </p>
    ${bookingSummary(data)}`
  );
}

export function bookingCheckedOutEmail(data: BookingEmailData): string {
  return baseLayout(
    "เช็คเอาท์สำเร็จ",
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      คืนเครื่องมือเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ:
    </p>
    ${bookingSummary(data)}`
  );
}

export function bookingReminderEmail(data: BookingEmailData): string {
  return baseLayout(
    "การจองเครื่องมือใกล้เริ่มใช้งาน",
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      การจองของคุณกำลังจะเริ่มขึ้นในอีกไม่ช้า กรุณาเตรียมตัวให้พร้อม:
    </p>
    ${bookingSummary(data)}`
  );
}

export function bookingRequestActionEmail(
  data: BookingEmailData,
  actionLabel: string
): string {
  return baseLayout(
    "มีคำขอคืน/ขยายเวลาการจองใหม่",
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      นักเรียน <strong>${escapeHtml(data.studentName)}</strong> (${escapeHtml(data.studentEmail)}) ขอ
      <strong>${escapeHtml(actionLabel)}</strong> สำหรับการจองนี้ รอการอนุมัติ:
    </p>
    ${adminBookingSummaryHtml(data, actionLabel)}`
  );
}

export function bookingRequestDecisionEmail(
  data: BookingEmailData,
  actionLabel: string,
  approved: boolean
): string {
  const title = approved ? "คำขอคืน/ขยายเวลาได้รับการอนุมัติ" : "คำขอคืน/ขยายเวลาถูกปฏิเสธ";
  const badgeColor = approved ? "#059669" : "#dc2626";
  return baseLayout(
    title,
    `
    <p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.6;">
      ผลการพิจารณาคำขอ <strong>${actionLabel}</strong> ของคุณ:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="background-color:${badgeColor};color:#ffffff;font-size:14px;font-weight:600;border-radius:999px;padding:8px 20px;">
          ${approved ? "✓ อนุมัติแล้ว" : "✕ ถูกปฏิเสธ"}
        </td>
      </tr>
    </table>
    ${bookingSummary(data)}`
  );
}
