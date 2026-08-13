"use server";

import { revalidatePath } from "next/cache";
import { db } from "@scilab/db";
import { getCurrentUser } from "@/lib/dal";

/** เคาะอ่านทั้งหมดให้ผู้ใช้ปัจจุบัน */
export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}

/** เคาะอ่านรายการเดียว */
export async function markNotificationRead(formData: FormData) {
  const user = await getCurrentUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await db.notification.updateMany({
    where: { id, userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}
