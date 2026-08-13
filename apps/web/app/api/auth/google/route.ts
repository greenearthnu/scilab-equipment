import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@scilab/db";
import { encrypt } from "@/lib/session";
import { withApiError } from "@/lib/api-handler";
import {
  allowedGoogleAudiences,
  allowedGoogleDomain,
  appOrigin,
  buildGoogleAuthUrl,
  buildRedirectUri,
  googleClientConfig,
  isAllowedGoogleEmail,
  verifyGoogleIdToken,
} from "@/lib/google-auth";

const BodySchema = z.object({
  idToken: z.string().min(1),
});

export const POST = withApiError(async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(parsed.data.idToken);
  } catch {
    return Response.json({ error: "บัญชี Google ไม่ถูกต้อง" }, { status: 401 });
  }

  const audiences = allowedGoogleAudiences();
  if (audiences.length > 0 && !audiences.includes(profile.aud)) {
    return Response.json({ error: "บัญชี Google ไม่ถูกต้อง" }, { status: 401 });
  }

  if (!isAllowedGoogleEmail(profile.email)) {
    return Response.json(
      { error: `กรุณาเข้าสู่ระบบด้วยอีเมล @${allowedGoogleDomain()} ของโรงเรียน` },
      { status: 403 }
    );
  }

  if (!profile.emailVerified) {
    return Response.json(
      { error: "อีเมล Google ยังไม่ได้รับการยืนยัน ไม่สามารถเข้าสู่ระบบได้" },
      { status: 403 }
    );
  }

  const email = profile.email.toLowerCase();

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: profile.name || email.split("@")[0],
      avatarUrl: profile.picture,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
    },
  });

  if (!user.isActive) {
    return Response.json(
      { error: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลห้องแล็บ" },
      { status: 403 }
    );
  }

  const token = await encrypt({
    userId: user.id,
    role: user.role,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return Response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      className: user.className,
      studentId: user.studentId,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
  });
});

export async function GET(request: Request) {
  if (!googleClientConfig()) {
    const login = new URL("/login?error=not_configured", appOrigin(request));
    return NextResponse.redirect(login);
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = buildRedirectUri(request);
  const authUrl = buildGoogleAuthUrl(state, redirectUri);
  return NextResponse.redirect(authUrl);
}
