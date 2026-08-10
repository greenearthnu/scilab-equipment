import { db } from "@scilab/db";
import { getApiUser, unauthorized } from "@/lib/auth-api";

const ACTIVE_STATUSES = ["PENDING", "APPROVED", "CHECKED_OUT"] as const;

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const instrumentId = url.searchParams.get("instrumentId");
  const dateStr = url.searchParams.get("date");

  if (!instrumentId || !dateStr) {
    return Response.json(
      { error: "กรุณาระบุเครื่องมือและวันที่" },
      { status: 400 }
    );
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return Response.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const bookings = await db.booking.findMany({
    where: {
      instrumentId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { startTime: true, endTime: true },
  });

  const takenRanges = bookings.map((b) => ({
    startTime: b.startTime,
    endTime: b.endTime,
  }));

  return Response.json({
    takenRanges,
  });
}
