import "server-only";
import { revalidatePath } from "next/cache";
import { db } from "@scilab/db";
import {
  ROLES,
  BOOKING_STATUS,
  BOOKING_REQUEST_TYPE,
  BOOKING_REQUEST_STATUS,
  isValidTime,
  type TimeRange,
} from "@scilab/shared";
import { sendPushNotification, sendPushToRole } from "@/lib/push";
import {
  sendEmail,
  sendEmailToRole,
  bookingRequestActionEmail,
  bookingRequestDecisionEmail,
  bookingCheckedOutEmail,
  type BookingEmailData,
} from "@/lib/email";
import { findTimeConflict } from "@/lib/booking-conflict";

type DecideResult = { ok: true } | { ok: false; error: string };

function bookingEmailData(booking: {
  user: { name: string; email: string };
  instrument: { name: string };
  date: Date;
  startTime: string;
  endTime: string;
  purpose: string | null;
}): BookingEmailData {
  return {
    studentName: booking.user.name,
    studentEmail: booking.user.email,
    instrumentName: booking.instrument.name,
    date: booking.date,
    slots: [{ startTime: booking.startTime, endTime: booking.endTime }],
    purpose: booking.purpose,
  };
}

async function notifyAdmins(title: string, message: string, emailHtml: string) {
  sendPushToRole(ROLES.TEACHER, title, message);
  sendPushToRole(ROLES.LAB_ADMIN, title, message);
  sendEmailToRole(ROLES.TEACHER, title, emailHtml);
  sendEmailToRole(ROLES.LAB_ADMIN, title, emailHtml);
}

/** ผู้ใช้ขอคืนเครื่องก่อนเวลา (เฉพาะการจองที่เช็คอินแล้ว) */
export async function requestEarlyReturn(
  userId: string,
  bookingId: string,
  reason?: string
): Promise<DecideResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, instrument: true },
  });
  if (!booking || booking.userId !== userId) {
    return { ok: false, error: "ไม่พบการจองนี้" };
  }
  if (booking.status !== BOOKING_STATUS.CHECKED_OUT) {
    return { ok: false, error: "ขอคืนได้เฉพาะการจองที่เช็คอินแล้วเท่านั้น" };
  }

  const hasPending = await db.bookingRequest.findFirst({
    where: {
      bookingId,
      status: BOOKING_REQUEST_STATUS.PENDING,
      type: BOOKING_REQUEST_TYPE.RETURN,
    },
  });
  if (hasPending) {
    return { ok: false, error: "มีคำขอคืนเครื่องก่อนเวลาที่รออนุมัติอยู่แล้ว" };
  }

  await db.bookingRequest.create({
    data: {
      bookingId,
      type: BOOKING_REQUEST_TYPE.RETURN,
      reason,
      requestedById: userId,
    },
  });

  const actionLabel = "คืนเครื่องก่อนเวลา";
  notifyAdmins(
    "มีคำขอคืนเครื่องก่อนเวลา",
    `${booking.user.name} ขอ${actionLabel}สำหรับ ${booking.instrument.name} (${booking.startTime}-${booking.endTime} น.)`,
    bookingRequestActionEmail(bookingEmailData(booking), actionLabel)
  );

  revalidatePath("/bookings");
  return { ok: true };
}

/** ผู้ใช้ขอขยายเวลาสิ้นสุดการจอง */
export async function requestExtend(
  userId: string,
  bookingId: string,
  newEndTime: string,
  reason?: string
): Promise<DecideResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, instrument: true },
  });
  if (!booking || booking.userId !== userId) {
    return { ok: false, error: "ไม่พบการจองนี้" };
  }
  if (booking.status !== BOOKING_STATUS.CHECKED_OUT) {
    return { ok: false, error: "ขอขยายเวลาได้เฉพาะการจองที่เช็คอินแล้วเท่านั้น" };
  }
  if (!isValidTime(newEndTime)) {
    return { ok: false, error: "รูปแบบเวลาไม่ถูกต้อง" };
  }
  if (newEndTime <= booking.endTime) {
    return { ok: false, error: "เวลาสิ้นสุดใหม่ต้องอยู่หลังเวลาสิ้นสุดปัจจุบัน" };
  }

  const hasPending = await db.bookingRequest.findFirst({
    where: {
      bookingId,
      status: BOOKING_REQUEST_STATUS.PENDING,
      type: BOOKING_REQUEST_TYPE.EXTEND,
    },
  });
  if (hasPending) {
    return { ok: false, error: "มีคำขอขยายเวลาที่รออนุมัติอยู่แล้ว" };
  }

  const range: TimeRange = { startTime: booking.startTime, endTime: newEndTime };
  const conflict = await findTimeConflict(
    booking.instrumentId,
    booking.date,
    range,
    booking.id
  );
  if (conflict) {
    return { ok: false, error: "ช่วงเวลาที่ขอขยายถูกจองไปแล้ว" };
  }

  await db.bookingRequest.create({
    data: {
      bookingId,
      type: BOOKING_REQUEST_TYPE.EXTEND,
      newEndTime,
      reason,
      requestedById: userId,
    },
  });

  const actionLabel = `ขยายเวลาเป็น ${newEndTime} น.`;
  notifyAdmins(
    "มีคำขอขยายเวลา",
    `${booking.user.name} ขอ${actionLabel}สำหรับ ${booking.instrument.name} (เดิม ${booking.endTime} น.)`,
    bookingRequestActionEmail(bookingEmailData(booking), actionLabel)
  );

  revalidatePath("/bookings");
  return { ok: true };
}

/** LAB_ADMIN/ครู อนุมัติหรือปฏิเสธคำขอคืน/ขยายเวลา */
export async function decideBookingRequest(
  deciderId: string,
  requestId: string,
  approve: boolean
): Promise<DecideResult> {
  const request = await db.bookingRequest.findUnique({
    where: { id: requestId },
    include: {
      booking: {
        include: { user: true, instrument: true },
      },
    },
  });
  if (!request || request.status !== BOOKING_REQUEST_STATUS.PENDING) {
    return { ok: false, error: "ไม่พบคำขอที่รออนุมัตินี้" };
  }

  const booking = request.booking;
  const isReturn = request.type === BOOKING_REQUEST_TYPE.RETURN;

  if (!approve) {
    await db.bookingRequest.update({
      where: { id: requestId },
      data: {
        status: BOOKING_REQUEST_STATUS.REJECTED,
        decidedById: deciderId,
        decidedAt: new Date(),
      },
    });

    const actionLabel = isReturn ? "คืนเครื่องก่อนเวลา" : "ขยายเวลา";
    const title = "คำขอคืน/ขยายเวลาถูกปฏิเสธ";
    const message = `คำขอ${actionLabel}สำหรับ ${booking.instrument.name} ถูกปฏิเสธ`;
    await db.notification.create({ data: { userId: booking.userId, title, message } });
    sendPushNotification(booking.userId, title, message);
    sendEmail(
      booking.user.email,
      title,
      bookingRequestDecisionEmail(bookingEmailData(booking), actionLabel, false)
    );

    revalidatePath("/bookings");
    return { ok: true };
  }

  // อนุมัติ
  if (isReturn) {
    if (booking.status !== BOOKING_STATUS.CHECKED_OUT) {
      return { ok: false, error: "การจองนี้เปลี่ยนสถานะไปแล้ว ไม่สามารถคืนได้" };
    }
    await db.$transaction([
      db.booking.update({
        where: { id: booking.id },
        data: { status: BOOKING_STATUS.COMPLETED },
      }),
      db.usageLog.updateMany({
        where: { bookingId: booking.id },
        data: { checkedOutAt: new Date() },
      }),
      db.bookingRequest.update({
        where: { id: requestId },
        data: {
          status: BOOKING_REQUEST_STATUS.APPROVED,
          decidedById: deciderId,
          decidedAt: new Date(),
        },
      }),
    ]);

    const title = "อนุมัติการคืนเครื่องก่อนเวลา";
    const message = `คืนเครื่อง ${booking.instrument.name} ก่อนเวลาเรียบร้อยแล้ว`;
    await db.notification.create({ data: { userId: booking.userId, title, message } });
    sendPushNotification(booking.userId, title, message);
    sendEmail(
      booking.user.email,
      title,
      bookingCheckedOutEmail(bookingEmailData(booking))
    );
  } else {
    const newEndTime = request.newEndTime;
    if (!newEndTime) {
      return { ok: false, error: "ข้อมูลเวลาขยายไม่ถูกต้อง" };
    }
    const range: TimeRange = { startTime: booking.startTime, endTime: newEndTime };
    const conflict = await findTimeConflict(
      booking.instrumentId,
      booking.date,
      range,
      booking.id
    );
    if (conflict) {
      return { ok: false, error: "ช่วงเวลาที่ขอขยายถูกจองไปแล้ว ไม่สามารถอนุมัติได้" };
    }
    if (booking.status !== BOOKING_STATUS.CHECKED_OUT) {
      return { ok: false, error: "การจองนี้เปลี่ยนสถานะไปแล้ว ไม่สามารถขยายได้" };
    }

    await db.$transaction([
      db.booking.update({
        where: { id: booking.id },
        data: { endTime: newEndTime },
      }),
      db.bookingRequest.update({
        where: { id: requestId },
        data: {
          status: BOOKING_REQUEST_STATUS.APPROVED,
          decidedById: deciderId,
          decidedAt: new Date(),
        },
      }),
    ]);

    const title = "อนุมัติการขยายเวลา";
    const message = `ขยายเวลาการจอง ${booking.instrument.name} เป็น ${newEndTime} น. เรียบร้อยแล้ว`;
    await db.notification.create({ data: { userId: booking.userId, title, message } });
    sendPushNotification(booking.userId, title, message);
    sendEmail(
      booking.user.email,
      title,
      bookingRequestDecisionEmail(bookingEmailData(booking), `ขยายเวลาเป็น ${newEndTime} น.`, true)
    );
  }

  revalidatePath("/bookings");
  return { ok: true };
}
