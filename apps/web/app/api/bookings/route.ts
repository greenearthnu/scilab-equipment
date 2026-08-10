import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES, sortTimeSlots } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { findSlotConflict } from "@/lib/booking-conflict";
import {
  sendEmailToRole,
  bookingRequestEmail,
  type BookingEmailData,
} from "@/lib/email";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1),
  date: z.string().min(1),
  timeSlots: z.array(z.string().min(1)).min(1),
  purpose: z.string().max(500).optional(),
});

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const bookings = await db.booking.findMany({
    where: { userId: user.id },
    include: {
      instrument: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
      slots: { select: { timeSlot: true } },
    },
    orderBy: { date: "desc" },
  });

  const mapped = bookings.map((b) => ({
    ...b,
    timeSlots: b.slots.map((s) => s.timeSlot),
    slots: undefined,
  }));

  return Response.json({ bookings: mapped });
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

  const { instrumentId, date, timeSlots, purpose } = parsed.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);
  const slots = sortTimeSlots([...new Set(timeSlots)]);

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return Response.json(
      { error: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" },
      { status: 400 }
    );
  }

  const conflict = await findSlotConflict(instrumentId, bookingDate, slots);
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
      purpose,
      slots: {
        create: slots.map((timeSlot) => ({ timeSlot })),
      },
    },
    include: {
      instrument: { select: { id: true, name: true, category: true } },
      slots: { select: { timeSlot: true } },
    },
  });

  const emailData: BookingEmailData = {
    studentName: user.name,
    studentEmail: user.email,
    instrumentName: instrument.name,
    date: bookingDate,
    slots,
    purpose,
  };
  const emailSubject = `มีคำขอจองใหม่: ${instrument.name}`;
  const emailHtml = bookingRequestEmail(emailData);
  sendEmailToRole(ROLES.TEACHER, emailSubject, emailHtml);
  sendEmailToRole(ROLES.LAB_ADMIN, emailSubject, emailHtml);

  return Response.json(
    {
      booking: {
        ...booking,
        timeSlots: booking.slots.map((s) => s.timeSlot),
        slots: undefined,
      },
    },
    { status: 201 }
  );
}
