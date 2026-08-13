"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, ScoreLogSource } from "@scilab/db";
import { ROLES, BOOKING_STATUS, isAdminRole, isValidTimeRange, type TimeRange } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { sendPushNotification, sendPushToRole } from "@/lib/push";
import {
  sendEmail,
  sendEmailToRole,
  bookingRequestEmail,
  bookingDecisionEmail,
  type BookingEmailData,
} from "@/lib/email";
import { findAvailabilityConflict } from "@/lib/booking-conflict";
import {
  awardScore,
  isUserLockedOut,
  getLockedOutMessage,
} from "@/lib/score";
import { getScoreSettings } from "@/lib/score-settings";
import { sendAdminAlert } from "@/lib/telegram";
import { formatBookingSummary } from "@scilab/shared";
import { recurrenceDates } from "@/lib/recurring-booking";
import { notifyWaitlistForSlot } from "@/lib/waitlist";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1, "กรุณาเลือกเครื่องมือ"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  startTime: z.string().min(1, "กรุณาเลือกเวลาเริ่ม"),
  endTime: z.string().min(1, "กรุณาเลือกเวลาสิ้นสุด"),
  purpose: z.string().max(500).trim().optional(),
  reminderOffsetMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  // จองซ้ำ: NONE / WEEKLY / MONTHLY (+ วันที่สิ้นสุด)
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY"]).default("NONE"),
  recurrenceEndDate: z.string().optional(),
});

export type BookingFormState =
  | {
      errors?: {
        instrumentId?: string[];
        date?: string[];
        startTime?: string[];
        endTime?: string[];
        purpose?: string[];
        reminderOffsetMinutes?: string[];
        recurrence?: string[];
        recurrenceEndDate?: string[];
      };
      message?: string;
    }
  | undefined;

export async function createBooking(
  state: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const user = await getCurrentUser();

  if (await isUserLockedOut(user.score)) {
    return { message: await getLockedOutMessage() };
  }

  const validated = CreateBookingSchema.safeParse({
    instrumentId: formData.get("instrumentId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose"),
    reminderOffsetMinutes: formData.get("reminderOffsetMinutes"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const {
    instrumentId,
    date,
    startTime,
    endTime,
    purpose,
    reminderOffsetMinutes,
    recurrence,
    recurrenceEndDate,
  } = validated.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);

  const range: TimeRange = { startTime, endTime };
  if (!isValidTimeRange(range)) {
    return { errors: { endTime: ["เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม"] } };
  }

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return { message: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" };
  }

  // --- คำนวณวันที่ทั้งหมด (จองครั้งเดียว หรือจองซ้ำ) ---
  let dates: Date[] = [bookingDate];
  let recurrenceEnd: Date | null = null;
  if (recurrence !== "NONE") {
    if (!recurrenceEndDate) {
      return { message: "กรุณาเลือกวันที่สิ้นสุดการจองซ้ำ" };
    }
    recurrenceEnd = new Date(`${recurrenceEndDate}T00:00:00.000Z`);
    if (recurrenceEnd < bookingDate) {
      return { message: "วันที่สิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม" };
    }
    dates = recurrenceDates(bookingDate, recurrence, recurrenceEnd);
  }
  const groupId = recurrence !== "NONE" ? crypto.randomUUID() : null;

  // --- สร้างการจองทีละวัน (ข้ามวันที่ไม่ว่าง) ---
  const created: { id: string; date: Date }[] = [];
  const skippedDates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const d of dates) {
    if (d < today) {
      skippedDates.push(d);
      continue;
    }
    const conflict = await findAvailabilityConflict(instrumentId, d, range);
    if (conflict) {
      skippedDates.push(d);
      continue;
    }
    const b = await db.booking.create({
      data: {
        userId: user.id,
        instrumentId,
        date: d,
        startTime,
        endTime,
        purpose,
        reminderOffsetMinutes: reminderOffsetMinutes ?? 0,
        recurrence,
        recurrenceEndDate: recurrenceEnd,
        recurrenceGroupId: groupId,
      },
    });
    created.push({ id: b.id, date: d });
  }

  if (created.length === 0) {
    return {
      message:
        recurrence !== "NONE"
          ? "ไม่สามารถจองได้ — ทุกวันที่เลือกถูกจองหรืออยู่ในช่วงซ่อมบำรุงแล้ว"
          : "ช่วงเวลานี้ถูกจองหรืออยู่ในช่วงซ่อมบำรุงแล้ว กรุณาเลือกช่วงเวลาอื่น",
    };
  }

  const first = created[0].date;
  const countNote =
    recurrence !== "NONE"
      ? ` (${created.length} ครั้ง${skippedDates.length ? `, ข้าม ${skippedDates.length} วันที่ไม่ว่าง` : ""})`
      : "";

  await db.notification.create({
    data: {
      userId: user.id,
      title: "ส่งคำขอจองสำเร็จ",
      message: `คำขอจอง ${instrument.name} กำลังรอการอนุมัติ${countNote}`,
    },
  });

  const bookingInfo = {
    studentName: user.name,
    studentScore: user.score,
    className: user.className,
    instrumentName: instrument.name,
    date: first,
    startTime,
    endTime,
    purpose,
    actionNote: `ขอจองเครื่องมือ${countNote}`,
  };
  const bookingMsg = formatBookingSummary(bookingInfo);
  sendPushToRole(ROLES.TEACHER, "มีคำขอจองใหม่", bookingMsg);
  sendPushToRole(ROLES.LAB_ADMIN, "มีคำขอจองใหม่", bookingMsg);
  sendPushToRole(ROLES.OWNER, "มีคำขอจองใหม่", bookingMsg);

  const emailData: BookingEmailData = {
    studentName: user.name,
    studentEmail: user.email,
    instrumentName: instrument.name,
    date: first,
    slots: [range],
    purpose,
    studentScore: user.score,
    className: user.className,
  };
  const emailSubject = `มีคำขอจองใหม่: ${instrument.name}${countNote}`;
  const emailHtml = bookingRequestEmail(emailData);
  sendEmailToRole(ROLES.TEACHER, emailSubject, emailHtml);
  sendEmailToRole(ROLES.LAB_ADMIN, emailSubject, emailHtml);
  sendEmailToRole(ROLES.OWNER, emailSubject, emailHtml);
  // Telegram — ผู้ดูแล/ระบบ (ฟรีไม่จำกัด) ถ้าตั้ง TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
  // ส่งตามรูปแบบที่ผู้ดูแลแต่ละคนเลือก + ลิงก์ชี้ตรงไปที่คำขอจองแรกบนหน้า /bookings
  void sendAdminAlert("🔔 มีคำขอจองใหม่", bookingInfo, `/bookings#booking-${created[0].id}`);

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings");
}

export async function updateBookingStatus(formData: FormData) {
  const bookingId = formData.get("bookingId");
  const status = formData.get("status");

  if (
    typeof bookingId !== "string" ||
    (status !== "APPROVED" && status !== "REJECTED")
  ) {
    return;
  }

  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status,
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, instrument: true },
  });

  if (booking) {
    if (status === "REJECTED") {
      // ช่องว่างลง → แจ้งคนแรกในคิวรอ
      await notifyWaitlistForSlot(
        booking.instrumentId,
        booking.date,
        { startTime: booking.startTime, endTime: booking.endTime }
      );
    }

    const title =
      status === "APPROVED"
        ? "คำขององถูกอนุมัติแล้ว"
        : "คำของจองถูกปฏิเสธ";
    const message =
      status === "APPROVED"
        ? `การจอง ${booking.instrument.name} ได้รับการอนุมัติแล้ว`
        : `การจอง ${booking.instrument.name} ถูกปฏิเสธ`;

    await db.notification.create({
      data: {
        userId: booking.userId,
        title,
        message,
      },
    });

    sendPushNotification(booking.userId, title, message);

    sendEmail(
      booking.user.email,
      title,
      bookingDecisionEmail(
        {
          studentName: booking.user.name,
          studentEmail: booking.user.email,
          instrumentName: booking.instrument.name,
          date: booking.date,
          slots: [{ startTime: booking.startTime, endTime: booking.endTime }],
          purpose: booking.purpose,
        },
        status === "APPROVED"
      )
    );
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function cancelBooking(formData: FormData) {
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string") return;

  const user = await getCurrentUser();

  const booking = await db.booking.findUnique({ where: { id: bookingId } });

  if (!booking) return;
  if (booking.userId !== user.id) {
    throw new Error("ไม่มีสิทธิ์ยกเลิกการจองนี้");
  }
  if (booking.status !== "PENDING" && booking.status !== "APPROVED") {
    return;
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.CANCELLED },
  });

  // ช่องว่างลง → แจ้งคนแรกในคิวรอ
  await notifyWaitlistForSlot(
    booking.instrumentId,
    booking.date,
    { startTime: booking.startTime, endTime: booking.endTime },
    user.id
  );

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export type EvidenceFormState =
  | { errors?: { evidence?: string[] }; message?: string }
  | undefined;

export async function uploadEvidence(
  state: EvidenceFormState,
  formData: FormData
): Promise<EvidenceFormState> {
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string") {
    return { message: "ไม่พบการจอง" };
  }

  const user = await getCurrentUser();

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { message: "ไม่พบการจอง" };
  if (booking.userId !== user.id && !isAdminRole(user.role)) {
    return { message: "ไม่มีสิทธิ์อัปโหลดรูปหลักฐาน" };
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    return { message: "ยังไม่ถึงขั้นตอนอัปโหลดรูปหลักฐาน" };
  }

  const file = formData.get("evidence");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { evidence: ["กรุณาเลือกรูปภาพ"] } };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { errors: { evidence: ["รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP"] } };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { errors: { evidence: ["ขนาดไฟล์ต้องไม่เกิน 5MB"] } };
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const fileName = `evidence-${booking.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "evidence");

  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);
  } catch {
    return { message: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" };
  }

  const prevEvidence = booking.evidenceUrl;
  await db.booking.update({
    where: { id: bookingId },
    data: { evidenceUrl: `/uploads/evidence/${fileName}` },
  });

  // ให้คะแนนครั้งแรกที่อัปโหลดรูปหลักฐาน (จัดเก็บ/ล้างอุปกรณ์หลังใช้แล้ว)
  if (!prevEvidence && booking.userId === user.id) {
    const settings = await getScoreSettings();
    await awardScore(
      booking.userId,
      settings.evidenceBonus,
      ScoreLogSource.EVIDENCE
    );
  }

  if (prevEvidence?.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", prevEvidence);
    unlink(oldPath).catch(() => {});
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return { message: "อัปโหลดรูปหลักฐานเรียบร้อย" };
}
