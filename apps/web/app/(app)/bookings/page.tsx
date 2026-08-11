import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import {
  ROLES,
  formatTimeRange,
  BOOKING_REQUEST_TYPE_LABELS,
} from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import {
  updateBookingStatus,
  cancelBooking,
  checkIn,
  checkOut,
} from "@/lib/actions/bookings";
import {
  submitRequestEarlyReturn,
  submitRequestExtend,
  submitDecideRequest,
} from "@/lib/actions/booking-requests";
import { BookingStatusBadge } from "@/components/status-badge";
import QrButton from "@/components/bookings/qr-button";
import EvidenceForm from "@/components/bookings/evidence-form";
import ConfirmSubmitButton from "@/components/confirm-submit-button";

export const metadata: Metadata = {
  title: "การจอง",
};

const canManage = (role: string) =>
  role === ROLES.TEACHER || role === ROLES.LAB_ADMIN;

interface BookingsPageProps {
  searchParams: Promise<{ msg?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { msg } = await searchParams;
  const user = await getCurrentUser();
  const isManager = canManage(user.role);

  const [myBookings, pendingBookings, allBookings, pendingRequests, myPendingRequestBookingIds] =
    await Promise.all([
      db.booking.findMany({
        where: { userId: user.id },
        include: { instrument: true, approvedBy: true },
        orderBy: { date: "desc" },
      }),
      isManager
        ? db.booking.findMany({
            where: { status: "PENDING" },
            include: { user: true, instrument: true },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
      isManager || user.role === ROLES.EXECUTIVE
        ? db.booking.findMany({
            where: { status: { in: ["APPROVED", "CHECKED_OUT"] } },
            include: { user: true, instrument: true },
            orderBy: { date: "asc" },
            take: 20,
          })
        : Promise.resolve([]),
      isManager
        ? db.bookingRequest.findMany({
            where: { status: "PENDING" },
            include: {
              booking: { include: { instrument: true } },
              requestedBy: true,
            },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
      db.bookingRequest.findMany({
        where: { requestedById: user.id, status: "PENDING" },
        select: { bookingId: true },
      }),
    ]);

  const pendingRequestBookingIds = new Set(
    myPendingRequestBookingIds.map((r) => r.bookingId)
  );

  const slotLabel = (b: { startTime: string; endTime: string }) =>
    formatTimeRange({ startTime: b.startTime, endTime: b.endTime });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การจอง</h1>
          <p className="mt-1 text-slate-600">
            จัดการการจองเครื่องมือในห้องปฏิบัติการ
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          + จองเครื่องมือ
        </Link>
      </div>

      {msg && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {msg}
        </p>
      )}

      {isManager && pendingRequests.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-white">
          <div className="border-b border-amber-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">
              คำขอคืน/ขยายเวลากำลังรออนุมัติ ({pendingRequests.length})
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {r.type === "RETURN" ? "ขอคืนเครื่องก่อนเวลา" : "ขอขยายเวลา"}{" "}
                    • {r.booking.instrument.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.requestedBy.name} • {r.booking.date.toLocaleDateString("th-TH")} •{" "}
                    {slotLabel(r.booking)}
                    {r.type === "EXTEND" && r.newEndTime && (
                      <> → ขยายถึง {r.newEndTime} น.</>
                    )}
                    {r.reason && <> • {r.reason}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={submitDecideRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="approve" />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      อนุมัติ
                    </button>
                  </form>
                  <form action={submitDecideRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <ConfirmSubmitButton
                      title="ปฏิเสธคำขอ?"
                      message={`ปฏิเสธคำขอ${BOOKING_REQUEST_TYPE_LABELS[r.type]}ของ ${r.requestedBy.name}?`}
                      confirmLabel="ปฏิเสธ"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      ปฏิเสธ
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isManager && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">
              คำขอยากำลังรออนุมัติ ({pendingBookings.length})
            </h2>
          </div>
          {pendingBookings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              ไม่มีคำขอยากำลังรออนุมัติ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {b.instrument.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.user.name}
                      {b.user.className ? ` (${b.user.className})` : ""} •{" "}
                      {b.date.toLocaleDateString("th-TH")} • {slotLabel(b)}
                      {b.purpose && <> • {b.purpose}</>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={updateBookingStatus}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        อนุมัติ
                      </button>
                    </form>
                    <form action={updateBookingStatus}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <ConfirmSubmitButton
                        title="ปฏิเสธคำขอจอง?"
                        message={`ปฏิเสธคำขอจอง ${b.instrument.name} ของ ${b.user.name} วันที่ ${b.date.toLocaleDateString("th-TH")}?`}
                        confirmLabel="ปฏิเสธ"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        ปฏิเสธ
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">ประวัติการจองของฉัน</h2>
        </div>
        {myBookings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">ยังไม่มีการจอง</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {myBookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {b.instrument.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.date.toLocaleDateString("th-TH")} • {slotLabel(b)}
                    {b.purpose && <> • {b.purpose}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={b.status} />
                  {(b.status === "APPROVED" || b.status === "CHECKED_OUT") && (
                    <QrButton bookingId={b.id} title={b.instrument.name} />
                  )}
                  {(b.status === "PENDING" || b.status === "APPROVED") && (
                    <form action={cancelBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <ConfirmSubmitButton
                        title="ยกเลิกการจอง?"
                        message={`ยกเลิกการจอง ${b.instrument.name} วันที่ ${b.date.toLocaleDateString("th-TH")}?`}
                        confirmLabel="ยกเลิกการจอง"
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        ยกเลิก
                      </ConfirmSubmitButton>
                    </form>
                  )}
                  {b.status === "CHECKED_OUT" && !pendingRequestBookingIds.has(b.id) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={submitRequestEarlyReturn}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <ConfirmSubmitButton
                          title="ขอคืนเครื่องก่อนเวลา?"
                          message={`ส่งคำขอคืนเครื่อง ${b.instrument.name} ก่อนเวลา (${b.endTime} น.)?`}
                          confirmLabel="ส่งคำขอ"
                          className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          ขอคืนก่อนเวลา
                        </ConfirmSubmitButton>
                      </form>
                      <form
                        action={submitRequestExtend}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="bookingId"
                          value={b.id}
                        />
                        <input
                          type="time"
                          name="newEndTime"
                          min={b.endTime}
                          required
                          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                          title="เวลาสิ้นสุดใหม่"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          ขอขยายเวลา
                        </button>
                      </form>
                    </div>
                  )}
                  {b.status === "CHECKED_OUT" && pendingRequestBookingIds.has(b.id) && (
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      มีคำขอกำลังรออนุมัติ
                    </span>
                  )}
                  {(b.status === "CHECKED_OUT" || b.status === "COMPLETED") && (
                    <EvidenceForm booking={b} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(isManager || user.role === ROLES.EXECUTIVE) && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">
              การจองที่อนุมัติ / เช็คเอาท์
            </h2>
          </div>
          {allBookings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              ไม่มีการจองที่อนุมัติ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {allBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {b.instrument.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.user.name}
                      {b.user.className ? ` (${b.user.className})` : ""} •{" "}
                      {b.date.toLocaleDateString("th-TH")} • {slotLabel(b)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingStatusBadge status={b.status} />
                    {user.role === ROLES.LAB_ADMIN &&
                      b.status === "APPROVED" && (
                        <form action={checkIn}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                          >
                            เช็คอิน
                          </button>
                        </form>
                      )}
                    {user.role === ROLES.LAB_ADMIN &&
                      b.status === "CHECKED_OUT" && (
                        <form action={checkOut}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <ConfirmSubmitButton
                            title="เช็คเอาท์?"
                            message={`ยืนยันการคืนเครื่อง ${b.instrument.name} ของ ${b.user.name}?`}
                            confirmLabel="เช็คเอาท์"
                            className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                          >
                            เช็คเอาท์
                          </ConfirmSubmitButton>
                        </form>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
