"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES, BOOKING_STATUS } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1, "กรุณาเลือกเครื่องมือ"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  timeSlot: z.string().min(1, "กรุณาเลือกช่วงเวลา"),
  purpose: z.string().max(500).trim().optional(),
});

export type BookingFormState = {
  errors?: {
    instrumentId?: string[];
    date?: string[];
    timeSlot?: string[];
    purpose?: string[];
  };
  message?: string;
};

export async function createBooking(
  state: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const user = await getCurrentUser();

  const validated = CreateBookingSchema.safeParse({
    instrumentId: formData.get("instrumentId"),
    date: formData.get("date"),
    timeSlot: formData.get("timeSlot"),
    purpose: formData.get("purpose"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { instrumentId, date, timeSlot, purpose } = validated.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return { message: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" };
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
    return { message: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกช่วงเวลาอื่น" };
  }

  await db.booking.create({
    data: {
      userId: user.id,
      instrumentId,
      date: bookingDate,
      timeSlot,
      purpose,
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      title: "ส่งคำขอจองสำเร็จ",
      message: `คำขอจอง ${instrument.name} กำลังรอการอนุมัติ`,
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings");
}

export async function updateBookingStatus(
  bookingId: string,
  status: "APPROVED" | "REJECTED"
) {
  const user = await getCurrentUser();
  if (user.role !== ROLES.TEACHER && user.role !== ROLES.LAB_ADMIN) {
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
    await db.notification.create({
      data: {
        userId: booking.userId,
        title:
          status === "APPROVED"
            ? "คำขององถูกอนุมัติแล้ว"
            : "คำของจองถูกปฏิเสธ",
        message:
          status === "APPROVED"
            ? `การจอง ${booking.instrument.name} ได้รับการอนุมัติแล้ว`
            : `การจอง ${booking.instrument.name} ถูกปฏิเสธ`,
      },
    });
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function cancelBooking(bookingId: string) {
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

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function checkIn(bookingId: string) {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking || booking.status !== "APPROVED") return;

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.CHECKED_OUT },
    }),
    db.usageLog.create({
      data: {
        bookingId,
        userId: booking.userId,
        instrumentId: booking.instrumentId,
        checkedInAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function checkOut(bookingId: string) {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking || booking.status !== "CHECKED_OUT") return;

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.COMPLETED },
    }),
    db.usageLog.updateMany({
      where: { bookingId },
      data: { checkedOutAt: new Date() },
    }),
  ]);

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}
