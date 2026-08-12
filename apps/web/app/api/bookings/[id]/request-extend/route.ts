import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { requestExtend } from "@/lib/booking-request-service";

const RequestExtendSchema = z.object({
  newEndTime: z.string().min(1),
  reason: z.string().max(500).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withApiError(async function POST(
  request: Request,
  ctx: RouteContext
) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = RequestExtendSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "กรุณาระบุเวลาสิ้นสุดใหม่" }, { status: 400 });
  }

  const result = await requestExtend(user.id, id, parsed.data.newEndTime, parsed.data.reason);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
});
