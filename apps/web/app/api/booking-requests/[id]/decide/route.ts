import { z } from "zod";
import { isAdminRole } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { decideBookingRequest } from "@/lib/booking-request-service";

const DecideSchema = z.object({
  approve: z.boolean(),
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
  if (!isAdminRole(user.role)) {
    return Response.json({ error: "ไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = DecideSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const result = await decideBookingRequest(user.id, id, parsed.data.approve);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
});
