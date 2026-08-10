"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES, BOOKING_STATUS, sortTimeSlots } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { sendPushNotification, sendPushToRole } from "@/lib/push";
import { findSlotConflict } from "@/lib/booking-conflict";

const CreateBookingSchema = z.object({
  instrumentId: z.string().min(1, "กรุณาเลือกเครื่องมือ"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  timeSlots: z.array(z.string().min(1)).min(1, "กรุณาเลือกช่วงเวลาอย่างน้อย 1 คาบ"),
  purpose: z.string().max(500).trim().optional(),
});

export type BookingFormState =
  | {
      errors?: {
        instrumentId?: string[];
        date?: string[];
        timeSlots?: string[];
        purpose?: string[];
      };
      message?: string;
    }
  | undefined;

export async function createBooking(
  state: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const user = await getCurrentUser();

  const rawSlots = formData.getAll("timeSlots");
  const parsedSlots = rawSlots
    .flatMap((v) => (typeof v === "string" ? v.split(",") : []))
    .filter((s) => s.length > 0);

  const validated = CreateBookingSchema.safeParse({
    instrumentId: formData.get("instrumentId"),
    date: formData.get("date"),
    timeSlots: parsedSlots,
    purpose: formData.get("purpose"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { instrumentId, date, purpose } = validated.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);
  const timeSlots = sortTimeSlots([...new Set(validated.data.timeSlots)]);

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument || instrument.status !== "AVAILABLE") {
    return { message: "เครื่องมือนี้ไม่พร้อมใช้งานในขณะนี้" };
  }

  const conflict = await findSlotConflict(instrumentId, bookingDate, timeSlots);
  if (conflict) {
    return { message: "ช่วงเวลานี้ถูกจองไปแล้ว กรุณาเลือกช่วงเวลาอื่น" };
  }

  await db.booking.create({
    data: {
      userId: user.id,
      instrumentId,
      date: bookingDate,
      purpose,
      slots: {
        create: timeSlots.map((timeSlot) => ({ timeSlot })),
      },
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      title: "ส่งคำขอจองสำเร็จ",
      message: `คำขอจอง ${instrument.name} กำลังรอการอนุมัติ`,
    },
  });

  const studentName = user.name;
  const slotLabel = timeSlots.join(", ");
  sendPushToRole(
    ROLES.TEACHER,
    "มีคำขอจองใหม่",
    `${studentName} ขอจอง ${instrument.name} คาบ ${slotLabel} วันที่ ${bookingDate.toLocaleDateString("th-TH")}`
  );
  sendPushToRole(
    ROLES.LAB_ADMIN,
    "มีคำขอจองใหม่",
    `${studentName} ขอจอง ${instrument.name} คาบ ${slotLabel} วันที่ ${bookingDate.toLocaleDateString("th-TH")}`
  );

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

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function checkIn(formData: FormData) {
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string") return;

  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { instrument: true },
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

  sendPushNotification(
    booking.userId,
    "เช็คอินสำเร็จ",
    `เครื่อง ${booking.instrument.name} ถูกเช็คอินแล้ว`
  );

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function checkOut(formData: FormData) {
  const bookingId = formData.get("bookingId");
  if (typeof bookingId !== "string") return;

  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { instrument: true },
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

  sendPushNotification(
    booking.userId,
    "เช็คเอาท์สำเร็จ",
    `คืนเครื่อง ${booking.instrument.name} เรียบร้อยแล้ว`
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
  if (booking.userId !== user.id && user.role !== ROLES.LAB_ADMIN) {
    return { message: "ไม่มีสิทธิ์อัปโหลดรูปหลักฐาน" };
  }
  if (booking.status !== BOOKING_STATUS.CHECKED_OUT && booking.status !== BOOKING_STATUS.COMPLETED) {
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

  if (prevEvidence?.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", prevEvidence);
    unlink(oldPath).catch(() => {});
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return { message: "อัปโหลดรูปหลักฐานเรียบร้อย" };
}
