import { z } from "zod";
import { db } from "@scilab/db";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";

const RegisterDeviceSchema = z.object({
  pushToken: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
});

export const POST = withApiError(async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = RegisterDeviceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { pushToken, platform } = parsed.data;

  const existing = await db.device.findUnique({ where: { pushToken } });
  if (existing && existing.userId !== user.id) {
    return Response.json(
      { error: "ไม่มีสิทธิ์ลงทะเบียนอุปกรณ์นี้" },
      { status: 403 }
    );
  }

  await db.device.upsert({
    where: { pushToken },
    update: { userId: user.id, platform },
    create: { userId: user.id, pushToken, platform },
  });

  return Response.json({ success: true });
});
