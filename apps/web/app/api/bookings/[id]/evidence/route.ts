import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@scilab/db";
import { BOOKING_STATUS, ROLES } from "@scilab/shared";
import { getApiUser, unauthorized } from "@/lib/auth-api";

export async function POST(
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
  if (booking.userId !== user.id && user.role !== ROLES.LAB_ADMIN) {
    return Response.json({ error: "ไม่มีสิทธิ์อัปโหลดรูปหลักฐาน" }, { status: 403 });
  }
  if (
    booking.status !== BOOKING_STATUS.CHECKED_OUT &&
    booking.status !== BOOKING_STATUS.COMPLETED
  ) {
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

  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);
  } catch {
    return Response.json({ error: "ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่" }, { status: 500 });
  }

  const prevEvidence = booking.evidenceUrl;
  await db.booking.update({
    where: { id: booking.id },
    data: { evidenceUrl: `/uploads/evidence/${fileName}` },
  });

  if (prevEvidence?.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "public", prevEvidence);
    unlink(oldPath).catch(() => {});
  }

  return Response.json({
    evidenceUrl: `/uploads/evidence/${fileName}`,
  });
}
