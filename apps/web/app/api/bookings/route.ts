import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES, isValidTimeRange } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { findAvailabilityConflict } from "@/lib/booking-conflict";
import {
  sendEmailToRole,
  bookingRequestEmail,
  type BookingEmailData,
} from "@/lib/email";
import { isUserLockedOut, getLockedOutMessage } from "@/lib/score";
import { sendAdminAlert } from "@/lib/telegram";
import { recurrenceDates } from "@/lib/recurring-booking";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(dateStr: string): Date | null {
  if (!DATE_RE.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== dateStr) return null;
  return d;
}

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  purpose: z.string().max(500).optional(),
  reminderOffsetMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY"]).default("NONE"),
  recurrenceEndDate: z.string().optional(),
});

const bookingSelect = {
  instrument: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
} as const;

export const GET = withApiError(async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    include: bookingSelect,
    orderBy: { date: "desc" },
  });

  return Response.json({ bookings });
});

export const POST = withApiError(async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  if (await isUserLockedOut(user.score)) {
    return Response.json(
      { error: await getLockedOutMessage() },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "กรอกข้อมูลไม่ครบถ้วน" }, { status: 400 });
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
  } = parsed.data;

  const bookingDate = parseDate(date);
  if (!bookingDate) {
    return Response.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const range = { startTime, endTime };
  if (!isValidTimeRange(range)) {
    return Response.json(
      { error: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" },
      { status: 400 }
    );
  }

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return Response.json(
      { error: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" },
      { status: 400 }
    );
  }

  // --- วันที่ทั้งหมด (จองครั้งเดียว หรือจองซ้ำ) ---
  let dates: Date[] = [bookingDate];
  let recurrenceEnd: Date | null = null;
  if (recurrence !== "NONE") {
    if (!recurrenceEndDate) {
      return Response.json(
        { error: "กรุณาเลือกวันที่สิ้นสุดการจองซ้ำ" },
        { status: 400 }
      );
    }
    const end = parseDate(recurrenceEndDate);
    if (!end) {
      return Response.json(
        { error: "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    if (end < bookingDate) {
      return Response.json(
        { error: "วันที่สิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม" },
        { status: 400 }
      );
    }
    recurrenceEnd = end;
    dates = recurrenceDates(bookingDate, recurrence, end);
  }
  const groupId = recurrence !== "NONE" ? crypto.randomUUID() : null;

  const created: { id: string; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const d of dates) {
    if (d < today) continue;
    const conflict = await findAvailabilityConflict(instrumentId, d, range);
    if (conflict) continue;
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
      include: bookingSelect,
    });
    created.push({ id: b.id, date: d });
  }

  if (created.length === 0) {
    return Response.json(
      {
        error:
          recurrence !== "NONE"
            ? "ไม่สามารถจองได้ — ทุกวันที่เลือกถูกจองหรืออยู่ในช่วงซ่อมบำรุงแล้ว"
            : "ช่วงเวลานี้ถูกจองหรืออยู่ในช่วงซ่อมบำรุงแล้ว กรุณาเลือกช่วงเวลาอื่น",
      },
      { status: 409 }
    );
  }

  const first = created[0].date;
  const countNote =
    recurrence !== "NONE" ? ` (${created.length} ครั้ง)` : "";
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
  void sendAdminAlert(
    "🔔 มีคำขอจองใหม่",
    {
      studentName: user.name,
      studentScore: user.score,
      className: user.className,
      instrumentName: instrument.name,
      date: first,
      startTime,
      endTime,
      purpose,
      actionNote: `ขอจองเครื่องมือ${countNote}`,
    },
    `/bookings#booking-${created[0].id}`
  );

  return Response.json(
    { booking: created[0], createdCount: created.length },
    { status: 201 }
  );
});
