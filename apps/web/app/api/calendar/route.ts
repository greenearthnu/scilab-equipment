import { db } from "@scilab/db";
import { BOOKING_STATUS, ROLES } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES = new Set(Object.values(BOOKING_STATUS));

function parseDate(dateStr: string): Date | null {
  if (!DATE_RE.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== dateStr) return null;
  return d;
}

function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, 1));
  const end = new Date(Date.UTC(y ?? 0, m ?? 1, 1));
  return { start, end };
}

export const GET = withApiError(async function GET(request: Request) {
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
  if (from || to) {
    if (!from || !to) {
      return Response.json(
        { error: "ต้องระบุ both from และ to" },
        { status: 400 }
      );
    }
    const start = parseDate(from);
    const end = parseDate(to);
    if (!start || !end || start.getTime() > end.getTime()) {
      return Response.json({ error: "ช่วงวันที่ไม่ถูกต้อง" }, { status: 400 });
    }
    where.date = {
      gte: start,
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
  if (status && status !== "ALL") {
    if (!VALID_STATUSES.has(status as never)) {
      return Response.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }
    where.status = status;
  }

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
});
