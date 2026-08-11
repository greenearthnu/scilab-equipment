import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";

const requestSelect = {
  id: true,
  type: true,
  reason: true,
  newEndTime: true,
  status: true,
  createdAt: true,
  requestedBy: { select: { id: true, name: true, className: true } },
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

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const isManager =
    user.role === ROLES.TEACHER || user.role === ROLES.LAB_ADMIN;

  const requests = await db.bookingRequest.findMany({
    where: isManager
      ? { status: "PENDING" }
      : { requestedById: user.id, status: "PENDING" },
    select: requestSelect,
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ requests });
}
