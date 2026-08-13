import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@scilab/db";
import { createSession } from "@/lib/session";
import { getScoreSettings } from "@/lib/score-settings";
import {
  allowedGoogleAudiences,
  appOrigin,
  buildRedirectUri,
  exchangeCodeForIdToken,
  isAllowedGoogleEmail,
  verifyGoogleIdToken,
} from "@/lib/google-auth";

function redirectWithError(request: Request, error: string): Response {
  const url = new URL(`/login?error=${error}`, appOrigin(request));
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (errorParam || !code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, errorParam ? "access_denied" : "invalid");
  }

  const redirectUri = buildRedirectUri(request);

  let profile;
  try {
    const idToken = await exchangeCodeForIdToken(code, redirectUri);
    profile = await verifyGoogleIdToken(idToken);
  } catch {
    return redirectWithError(request, "invalid");
  }

  const audiences = allowedGoogleAudiences();
  if (audiences.length > 0 && !audiences.includes(profile.aud)) {
    return redirectWithError(request, "invalid");
  }

  if (!isAllowedGoogleEmail(profile.email)) {
    return redirectWithError(request, "domain");
  }

  if (!profile.emailVerified) {
    return redirectWithError(request, "invalid");
  }

  const email = profile.email.toLowerCase();

  const settings = await getScoreSettings();

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: profile.name || email.split("@")[0],
      avatarUrl: profile.picture,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      score: settings.initialScore,
    },
  });

  if (!user.isActive) {
    return redirectWithError(request, "disabled");
  }

  await createSession(user.id, user.role);
  return NextResponse.redirect(new URL("/", appOrigin(request)));
}
