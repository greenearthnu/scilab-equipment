import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@scilab/db";
import { BOOKING_STATUS, isAdminRole, SCORE_EVIDENCE_BONUS } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";
import { withApiError } from "@/lib/api-handler";
import { ScoreLogSource } from "@scilab/db";
import { awardScore } from "@/lib/score";

function isSupportedImage(buffer: Buffer, mime: string): boolean {
  const hex = buffer.subarray(0, 8).toString("hex");
  if (mime === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mime === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (mime === "image/webp") {
    return (
      hex.startsWith("52494646") &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export const POST = withApiError(async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "ไม่พบการจอง" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) {
    return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
  }
  if (booking.userId !== user.id && !isAdminRole(user.role)) {
    return Response.json({ error: "ไม่มีสิทธิ์อัปโหลดรูปหลักฐาน" }, { status: 403 });
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    return Response.json(
      { error: "ยังไม่ถึงขั้นตอนอัปโหลดรูปหลักฐาน" },
      { status: 400 }
    );
  }

  let file: File | undefined;
  try {
    const form = await request.formData();
    const candidate = form.get("evidence");
    if (candidate instanceof File && candidate.size > 0) {
      file = candidate;
    }
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!file) {
    return Response.json({ error: "กรุณาเลือกรูปภาพ" }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Response.json(
      { error: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP" },
      { status: 400 }
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "ขนาดไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });
  }

  const ext =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";
  const fileName = `evidence-${booking.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "evidence");

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return Response.json({ error: "อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่" }, { status: 400 });
  }

  if (!isSupportedImage(buffer, file.type)) {
    return Response.json(
      { error: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง (ตรวจสอบเนื้อหาไฟล์)" },
      { status: 400 }
    );
  }

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
  } catch {
    return Response.json({ error: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" }, { status: 500 });
  }

  const prevEvidence = booking.evidenceUrl;
  await db.booking.update({
    where: { id: booking.id },
    data: { evidenceUrl: `/uploads/evidence/${fileName}` },
  });

  // ให้คะแนนครั้งแรกที่ผู้จองอัปโหลดรูปหลักฐาน (จัดเก็บ/ล้างอุปกรณ์หลังใช้แล้ว)
  if (!prevEvidence && booking.userId === user.id) {
    await awardScore(booking.userId, SCORE_EVIDENCE_BONUS, ScoreLogSource.EVIDENCE);
  }

  if (prevEvidence?.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", prevEvidence);
    unlink(oldPath).catch(() => {});
  }

  return Response.json({
    evidenceUrl: `/uploads/evidence/${fileName}`,
  });
});
