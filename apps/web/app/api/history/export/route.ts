import { db } from "@scilab/db";
import { BOOKING_STATUS_LABELS } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { csvCell } from "@/lib/csv";

export const GET = withApiError(async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const instrumentId = searchParams.get("instrumentId") ?? "";

  const where: Record<string, unknown> = { userId: user.id };
  if (status && status !== "ALL") where.status = status;
  if (instrumentId && instrumentId !== "ALL") where.instrumentId = instrumentId;

  const bookings = await db.booking.findMany({
    where,
    include: { instrument: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  const rows: string[][] = [
    ["ประวัติการจองของฉัน", `${user.name} (${user.email})`],
    ["วันที่ออกรายงาน", new Date().toLocaleString("th-TH")],
    [],
    ["ลำดับ", "วันที่", "เวลาเริ่ม", "เวลาสิ้นสุด", "เครื่องมือ", "หมวดหมู่", "สถานะ", "วัตถุประสงค์"],
  ];

  bookings.forEach((b, i) => {
    rows.push([
      String(i + 1),
      b.date.toLocaleDateString("th-TH"),
      b.startTime,
      b.endTime,
      b.instrument.name,
      b.instrument.category,
      BOOKING_STATUS_LABELS[b.status] ?? b.status,
      b.purpose ?? "",
    ]);
  });

  const csv = rows
    .map((r) => r.map((cell) => csvCell(cell)).join(","))
    .join("\n");

  const dateStr = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-bookings-${dateStr}.csv"`,
    },
  });
});
