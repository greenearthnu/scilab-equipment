import { db } from "@scilab/db";
import { ROLES, BOOKING_STATUS } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { sendPushNotification } from "@/lib/push";

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
    include: { instrument: true },
  });
  if (!booking) {
    return Response.json({ error: "ไม่พบการจองนี้" }, { status: 404 });
  }
  if (booking.status !== "CHECKED_OUT") {
    return Response.json(
      { error: "การจองนี้ยังไม่ได้เช็คอิน" },
      { status: 400 }
    );
  }

  await db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: BOOKING_STATUS.COMPLETED },
    }),
    db.usageLog.updateMany({
      where: { bookingId: id },
      data: { checkedOutAt: new Date() },
    }),
  ]);

  sendPushNotification(
    booking.userId,
    "เช็คเอาท์สำเร็จ",
    `คืนเครื่อง ${booking.instrument.name} เรียบร้อยแล้ว`
  );

  return Response.json({ success: true });
}
