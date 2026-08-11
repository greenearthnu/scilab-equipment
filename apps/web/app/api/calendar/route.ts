import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";

function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, 1));
  const end = new Date(Date.UTC(y ?? 0, m ?? 1, 1));
  return { start, end };
}

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? "";
  const instrumentId = searchParams.get("instrumentId") ?? "";
  const status = searchParams.get("status") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const where: Record<string, unknown> = {};

  // มุมมองรายเดือน หรือช่วงวันที่กำหนด (from/to)
  if (from && to) {
    where.date = {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    };
  } else if (/^\d{4}-\d{2}$/.test(month)) {
    const { start, end } = monthRange(month);
    where.date = { gte: start, lt: end };
  } else {
    return Response.json({ error: "ต้องระบุ month=YYYY-MM หรือ from/to" }, { status: 400 });
  }

  // นักเรียนเห็นเฉพาะการจองของตัวเอง
  if (user.role === ROLES.STUDENT) {
    where.userId = user.id;
  }

  if (instrumentId) where.instrumentId = instrumentId;
  if (status && status !== "ALL") where.status = status;

  const isManager =
    user.role === ROLES.TEACHER || user.role === ROLES.LAB_ADMIN || user.role === ROLES.EXECUTIVE;

  const bookings = await db.booking.findMany({
    where,
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      purpose: true,
      instrument: { select: { id: true, name: true, category: true } },
      ...(isManager
        ? { user: { select: { id: true, name: true, className: true } } }
        : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return Response.json({ bookings });
}
