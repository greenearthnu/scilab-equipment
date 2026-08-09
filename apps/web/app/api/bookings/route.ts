import { z } from "zod";
import { db } from "@scilab/db";
import { getApiUser, unauthorized } from "@/lib/auth-api";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1),
  date: z.string().min(1),
  timeSlot: z.string().min(1),
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
    },
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
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

  const { instrumentId, date, timeSlot, purpose } = parsed.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return Response.json(
      { error: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" },
      { status: 400 }
    );
  }

  const conflict = await db.booking.findFirst({
    where: {
      instrumentId,
      date: bookingDate,
      timeSlot,
      status: { in: ["PENDING", "APPROVED", "CHECKED_OUT"] },
    },
  });

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
      timeSlot,
      purpose,
    },
    include: {
      instrument: { select: { id: true, name: true, category: true } },
    },
  });

  return Response.json({ booking }, { status: 201 });
}
