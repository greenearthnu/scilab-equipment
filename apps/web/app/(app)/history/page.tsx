import type { Metadata } from "next";
import { db } from "@scilab/db";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS,
  formatTimeRange,
} from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { BookingStatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "ประวัติการจองของฉัน",
};

interface HistoryPageProps {
  searchParams: Promise<{ status?: string; instrumentId?: string }>;
}

const ALLOWED_STATUSES = new Set(Object.values(BOOKING_STATUS));

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const status = ALLOWED_STATUSES.has(params.status as never)
    ? params.status
    : "ALL";
  const instrumentId = params.instrumentId ?? "ALL";

  const [instruments, myBookings] = await Promise.all([
    db.instrument.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.booking.findMany({
      where: {
        userId: user.id,
        ...(status !== "ALL" ? { status: status as never } : {}),
        ...(instrumentId !== "ALL" ? { instrumentId } : {}),
      },
      include: { instrument: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    }),
  ]);

  const counts = {
    total: myBookings.length,
    pending: myBookings.filter((b) => b.status === "PENDING").length,
    approved: myBookings.filter((b) => b.status === "APPROVED").length,
    checkedOut: myBookings.filter((b) => b.status === "CHECKED_OUT").length,
    completed: myBookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: myBookings.filter((b) => b.status === "CANCELLED").length,
    rejected: myBookings.filter((b) => b.status === "REJECTED").length,
  };

  const exportUrl = `/api/history/export?status=${encodeURIComponent(
    status ?? "ALL"
  )}&instrumentId=${encodeURIComponent(instrumentId ?? "ALL")}`;

  const summaryCards = [
    { label: "ทั้งหมด", value: counts.total, className: "bg-slate-50 text-slate-700" },
    { label: "รออนุมัติ", value: counts.pending, className: "bg-amber-50 text-amber-700" },
    { label: "อนุมัติ", value: counts.approved, className: "bg-emerald-50 text-emerald-700" },
    { label: "กำลังใช้", value: counts.checkedOut, className: "bg-blue-50 text-blue-700" },
    { label: "เสร็จสิ้น", value: counts.completed, className: "bg-slate-100 text-slate-600" },
    { label: "ยกเลิก", value: counts.cancelled, className: "bg-slate-50 text-slate-500" },
    { label: "ปฏิเสธ", value: counts.rejected, className: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ประวัติการจองของฉัน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ดูประวัติและสรุปการจองทั้งหมดของคุณ
          </p>
        </div>
        <a
          href={exportUrl}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          ⬇ Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {summaryCards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-slate-200 p-4 ${c.className}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">ทั้งหมด</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="instrumentId"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            เครื่องมือ
          </label>
          <select
            id="instrumentId"
            name="instrumentId"
            defaultValue={instrumentId}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">ทั้งหมด</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900"
        >
          กรอง
        </button>
        <a
          href="/history"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          ล้าง
        </a>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white">
        {myBookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            ไม่พบการจองที่ตรงกับเงื่อนไข
          </p>
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
                    {b.date.toLocaleDateString("th-TH")} •{" "}
                    {formatTimeRange({ startTime: b.startTime, endTime: b.endTime })}
                    {b.purpose && <> • {b.purpose}</>}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
