import { db } from "@scilab/db";
import { ROLES, BOOKING_STATUS } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { sendPushNotification } from "@/lib/push";
import { sendEmail, bookingCheckedInEmail } from "@/lib/email";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, ctx: RouteContext) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== ROLES.LAB_ADMIN) {
    return Response.json({ error: "ไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { user: true, instrument: true },
  });
  if (!booking) {
    return Response.json({ error: "ไม่พบการจองนี้" }, { status: 404 });
  }
  if (booking.status !== "APPROVED") {
    return Response.json(
      { error: "การจองนี้ยังไม่พร้อมให้เช็คอิน (ต้องอนุมัติก่อน)" },
      { status: 400 }
    );
  }

  await db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: BOOKING_STATUS.CHECKED_OUT },
    }),
    db.usageLog.create({
      data: {
        bookingId: id,
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
  sendEmail(
    booking.user.email,
    "เช็คอินสำเร็จ",
    bookingCheckedInEmail({
      studentName: booking.user.name,
      studentEmail: booking.user.email,
      instrumentName: booking.instrument.name,
      date: booking.date,
      slots: [{ startTime: booking.startTime, endTime: booking.endTime }],
      purpose: booking.purpose,
    })
  );

  return Response.json({ success: true });
}
