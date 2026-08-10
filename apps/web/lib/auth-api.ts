import "server-only";
import { headers } from "next/headers";
import { db } from "@scilab/db";
import { decrypt } from "@/lib/session";

export async function getApiUser() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  const session = await decrypt(token);

  if (!session?.userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      className: true,
      studentId: true,
      phone: true,
      avatarUrl: true,
    },
  });

  return user;
}

export function unauthorized() {
  return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
}
