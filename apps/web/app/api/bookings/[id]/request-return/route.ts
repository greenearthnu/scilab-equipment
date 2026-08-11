import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { requestEarlyReturn } from "@/lib/booking-request-service";

const RequestReturnSchema = z.object({
  reason: z.string().max(500).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, ctx: RouteContext) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }
  const parsed = RequestReturnSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  const result = await requestEarlyReturn(user.id, id, reason);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}
