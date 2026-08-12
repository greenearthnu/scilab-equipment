import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@scilab/db";
import { encrypt } from "@/lib/session";
import { withApiError } from "@/lib/api-handler";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(email: string, request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `${email.toLowerCase()}|${ip}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return false;
  if (now > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export const POST = withApiError(async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const key = rateLimitKey(email, request);
  if (isRateLimited(key)) {
    return Response.json(
      { error: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    recordFailure(key);
    return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    recordFailure(key);
    return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  if (!user.isActive) {
    recordFailure(key);
    return Response.json({ error: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลห้องแล็บ" }, { status: 403 });
  }

  attempts.delete(key);

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
