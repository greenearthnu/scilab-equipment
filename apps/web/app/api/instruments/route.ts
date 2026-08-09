import { db } from "@scilab/db";
import { getApiUser, unauthorized } from "@/lib/auth-api";

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const instruments = await db.instrument.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      imageUrl: true,
      totalQuantity: true,
      availableCount: true,
      status: true,
      location: true,
    },
    orderBy: { name: "asc" },
  });

  return Response.json({ instruments });
}
