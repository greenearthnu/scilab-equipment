import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES, isValidTimeRange } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { findTimeConflict } from "@/lib/booking-conflict";
import {
  sendEmailToRole,
  bookingRequestEmail,
  type BookingEmailData,
} from "@/lib/email";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  purpose: z.string().max(500).optional(),
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

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    include: bookingSelect,
    orderBy: { date: "desc" },
  });

  return Response.json({ bookings });
}

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

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

  const { instrumentId, date, startTime, endTime, purpose } = parsed.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);

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

  const conflict = await findTimeConflict(instrumentId, bookingDate, range);
  if (conflict) {
    return Response.json(
      { error: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกช่วงเวลาอื่น" },
      { status: 409 }
    );
  }

  const booking = await db.booking.create({
    data: {
      userId: user.id,
      instrumentId,
      date: bookingDate,
      startTime,
      endTime,
      purpose,
    },
    include: bookingSelect,
  });

  const emailData: BookingEmailData = {
    studentName: user.name,
    studentEmail: user.email,
    instrumentName: instrument.name,
    date: bookingDate,
    slots: [range],
    purpose,
  };
  const emailSubject = `มีคำขอจองใหม่: ${instrument.name}`;
  const emailHtml = bookingRequestEmail(emailData);
  sendEmailToRole(ROLES.TEACHER, emailSubject, emailHtml);
  sendEmailToRole(ROLES.LAB_ADMIN, emailSubject, emailHtml);

  return Response.json({ booking }, { status: 201 });
}
