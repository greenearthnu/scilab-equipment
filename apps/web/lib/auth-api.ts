import "server-only";
import { cookies, headers } from "next/headers";
import { db } from "@scilab/db";
import { decrypt } from "@/lib/session";

export async function getApiUser() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");

  let session = null;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    session = await decrypt(token);
  }

  if (!session?.userId) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    if (cookie) {
      session = await decrypt(cookie);
    }
  }

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
      isActive: true,
      score: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export function unauthorized() {
  return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
}
