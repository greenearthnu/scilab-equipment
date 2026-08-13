import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { cancelWaitlist } from "@/lib/waitlist";

export const DELETE = withApiError(async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  const ok = await cancelWaitlist(user.id, id);
  if (!ok) {
    return Response.json({ error: "ไม่พบรายการคิวรอนี้" }, { status: 404 });
  }
  return Response.json({ ok: true });
});
