import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { getTakenRanges } from "@/lib/booking-conflict";

export const GET = withApiError(async function GET(request: Request) {
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

  // ช่วงที่ไม่ว่าง = การจองที่ยัง active + การซ่อมบำรุง (SCHEDULED/IN_PROGRESS)
  const takenRanges = await getTakenRanges(instrumentId, date);

  return Response.json({ takenRanges });
});
