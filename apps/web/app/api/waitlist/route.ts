import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { joinWaitlist, getMyWaitlist } from "@/lib/waitlist";

const JoinSchema = z.object({
  instrumentId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export const GET = withApiError(async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();
  const entries = await getMyWaitlist(user.id);
  return Response.json({ entries });
});

export const POST = withApiError(async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "กรอกข้อมูลไม่ครบถ้วน" }, { status: 400 });
  }

  const { instrumentId, date, startTime, endTime } = parsed.data;
  const bookingDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(bookingDate.getTime())) {
    return Response.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!startTime || !endTime || startTime >= endTime) {
    return Response.json(
      { error: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" },
      { status: 400 }
    );
  }

  const result = await joinWaitlist(user.id, instrumentId, bookingDate, {
    startTime,
    endTime,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true }, { status: 201 });
});
