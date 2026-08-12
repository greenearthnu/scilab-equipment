"use server";

import { redirect } from "next/navigation";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import {
  requestEarlyReturn,
  requestExtend,
  decideBookingRequest,
} from "@/lib/booking-request-service";

function redirectWithMessage(message: string) {
  redirect(`/bookings?msg=${encodeURIComponent(message)}`);
}

export async function submitRequestEarlyReturn(formData: FormData) {
  const user = await getCurrentUser();
  const bookingId = formData.get("bookingId");
  const reason = formData.get("reason");
  if (typeof bookingId !== "string") return;

  const result = await requestEarlyReturn(
    user.id,
    bookingId,
    typeof reason === "string" && reason.trim() ? reason.trim() : undefined
  );

  if (!result.ok) redirectWithMessage(result.error);
  redirectWithMessage("ส่งคำขอคืนเครื่องก่อนเวลาแล้ว รอการอนุมัติ");
}

export async function submitRequestExtend(formData: FormData) {
  const user = await getCurrentUser();
  const bookingId = formData.get("bookingId");
  const newEndTime = formData.get("newEndTime");
  const reason = formData.get("reason");
  if (typeof bookingId !== "string" || typeof newEndTime !== "string") return;

  const result = await requestExtend(
    user.id,
    bookingId,
    newEndTime,
    typeof reason === "string" && reason.trim() ? reason.trim() : undefined
  );

  if (!result.ok) redirectWithMessage(result.error);
  redirectWithMessage("ส่งคำขอขยายเวลาแล้ว รอการอนุมัติ");
}

export async function submitDecideRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  const requestId = formData.get("requestId");
  const decision = formData.get("decision");
  if (typeof requestId !== "string") return;

  const approve = decision === "approve";
  const result = await decideBookingRequest(user.id, requestId, approve);
  if (!result.ok) redirectWithMessage(result.error);
  redirectWithMessage(approve ? "อนุมัติคำขอเรียบร้อย" : "ปฏิเสธคำขอเรียบร้อย");
}
