"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@scilab/db";
import { isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";

const MaintenanceSchema = z.object({
  instrumentId: z.string().min(1, "กรุณาเลือกเครื่องมือ"),
  title: z.string().min(2, "กรุณากรอกหัวข้อการซ่อม").trim(),
  description: z.string().max(1000).trim().optional(),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  startTime: z.string().min(1, "กรุณาเลือกเวลาเริ่ม"),
  endTime: z.string().min(1, "กรุณาเลือกเวลาสิ้นสุด"),
});

export async function addMaintenance(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    throw new Error("เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่จัดการการซ่อมบำรุงได้");
  }

  const parsed = MaintenanceSchema.safeParse({
    instrumentId: formData.get("instrumentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    throw new Error(
      parsed.error.flatten().fieldErrors.title?.[0] ??
        parsed.error.flatten().fieldErrors.instrumentId?.[0] ??
        "ข้อมูลไม่ถูกต้อง"
    );
  }

  const { instrumentId, title, description, date, startTime, endTime } =
    parsed.data;
  if (startTime >= endTime) {
    throw new Error("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
  }

  const bookingDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(bookingDate.getTime())) {
    throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  }

  const instrument = await db.instrument.findUnique({
    where: { id: instrumentId },
  });
  if (!instrument) throw new Error("ไม่พบเครื่องมือ");

  const record = await db.maintenanceRecord.create({
    data: {
      instrumentId,
      title,
      description: description || null,
      date: bookingDate,
      startTime,
      endTime,
      createdById: user.id,
    },
  });

  await recordAudit(
    user.id,
    "MAINTENANCE_ADD",
    "MaintenanceRecord",
    record.id,
    `เพิ่มการซ่อม ${instrument.name}: ${title} (${date} ${startTime}-${endTime})`
  );

  revalidatePath("/instruments");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function updateMaintenanceStatus(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    throw new Error("เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่จัดการการซ่อมบำรุงได้");
  }

  const id = z.string().min(1).parse(formData.get("id"));
  const status = z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .parse(formData.get("status"));

  const record = await db.maintenanceRecord.findUnique({
    where: { id },
    include: { instrument: { select: { name: true } } },
  });
  if (!record) throw new Error("ไม่พบรายการซ่อมบำรุง");

  await db.maintenanceRecord.update({
    where: { id },
    data: { status },
  });

  await recordAudit(
    user.id,
    "MAINTENANCE_STATUS",
    "MaintenanceRecord",
    id,
    `เปลี่ยนสถานะการซ่อม ${record.instrument.name}: ${record.title} → ${status}`
  );

  revalidatePath("/instruments");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function deleteMaintenance(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    throw new Error("เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่จัดการการซ่อมบำรุงได้");
  }

  const id = z.string().min(1).parse(formData.get("id"));
  const record = await db.maintenanceRecord.findUnique({
    where: { id },
    include: { instrument: { select: { name: true } } },
  });
  if (!record) throw new Error("ไม่พบรายการซ่อมบำรุง");

  await db.maintenanceRecord.delete({ where: { id } });

  await recordAudit(
    user.id,
    "MAINTENANCE_DELETE",
    "MaintenanceRecord",
    id,
    `ลบการซ่อม ${record.instrument.name}: ${record.title}`
  );

  revalidatePath("/instruments");
  revalidatePath("/bookings");
}
