import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import {
  updateBookingStatus,
  cancelBooking,
  checkIn,
  checkOut,
} from "@/lib/actions/bookings";
import { BookingStatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "การจอง",
};

const canManage = (role: string) =>
  role === ROLES.TEACHER || role === ROLES.LAB_ADMIN;

export default async function BookingsPage() {
  const user = await getCurrentUser();
  const isManager = canManage(user.role);

  const [myBookings, pendingBookings, allBookings] = await Promise.all([
    db.booking.findMany({
      where: { userId: user.id },
      include: { instrument: true, approvedBy: true },
      orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
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
  ]);

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
                      {b.date.toLocaleDateString("th-TH")} • {b.timeSlot}
                      {b.purpose && <> • {b.purpose}</>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form
                      action={updateBookingStatus.bind(b.id, "APPROVED")}
                    >
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        อนุมัติ
                      </button>
                    </form>
                    <form
                      action={updateBookingStatus.bind(b.id, "REJECTED")}
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        ปฏิเสธ
                      </button>
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
                    {b.date.toLocaleDateString("th-TH")} • {b.timeSlot}
                    {b.purpose && <> • {b.purpose}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BookingStatusBadge status={b.status} />
                  {(b.status === "PENDING" || b.status === "APPROVED") && (
                    <form action={cancelBooking.bind(b.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        ยกเลิก
                      </button>
                    </form>
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
                      {b.date.toLocaleDateString("th-TH")} • {b.timeSlot}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingStatusBadge status={b.status} />
                    {user.role === ROLES.LAB_ADMIN &&
                      b.status === "APPROVED" && (
                        <form action={checkIn.bind(b.id)}>
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
                        <form action={checkOut.bind(b.id)}>
                          <button
                            type="submit"
                            className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                          >
                            เช็คเอาท์
                          </button>
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
