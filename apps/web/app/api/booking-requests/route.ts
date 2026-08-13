import { db } from "@scilab/db";
import { ROLES, isAdminRole } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";

const requestSelect = {
  id: true,
  type: true,
  reason: true,
  newEndTime: true,
  status: true,
  createdAt: true,
  requestedBy: { select: { id: true, name: true, className: true, score: true } },
  booking: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      instrument: { select: { id: true, name: true } },
    },
  },
} as const;

export const GET = withApiError(async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const isManager =
    user.role === ROLES.TEACHER || isAdminRole(user.role);

  const requests = await db.bookingRequest.findMany({
    where: isManager
      ? { status: "PENDING" }
      : { requestedById: user.id, status: "PENDING" },
    select: requestSelect,
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ requests });
});
