import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { db } from "@scilab/db";
import { ROLES, ROLE_LABELS, isAdminRole } from "@scilab/shared";
import { getScoreSettings } from "@/lib/score-settings";
import { getCurrentUser } from "@/lib/dal";
import { getUserUsage } from "@/lib/user-usage";
import UserUsageCharts from "@/components/users/user-usage-charts";
import { BookingStatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "การใช้งานรายบุคคล",
};

const SCORE_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "ผู้ดูแลปรับ",
  EARLY_RETURN: "คืนเครื่องก่อนเวลา/ตรงเวลา",
  EVIDENCE: "อัปโหลดรูปหลักฐาน",
  UNLOCK: "ปลดล็อกโดยผู้ดูแล",
};

export default async function UserUsagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!isAdminRole(currentUser.role) && currentUser.role !== ROLES.TEACHER) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const data = await getUserUsage(id);
  if (!data) notFound();

  const scoreLogs = await db.scoreLog.findMany({
    where: { userId: id },
    include: { performedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const { user, summary } = data;

  const scoreSettings = await getScoreSettings();
  const minToBook = scoreSettings.minToBook;
  const locked = user.score < minToBook;

  const summaryCards = [
    { label: "การจองทั้งหมด", value: String(summary.totalBookings), color: "text-slate-900" },
    { label: "รออนุมัติ", value: String(summary.pendingCount), color: "text-amber-600" },
    { label: "อนุมัติ", value: String(summary.approvedCount), color: "text-emerald-600" },
    { label: "เสร็จสิ้น", value: String(summary.completedCount), color: "text-slate-700" },
    { label: "ยกเลิก", value: String(summary.cancelledCount), color: "text-slate-400" },
    { label: "ชั่วโมงที่จอง", value: `${summary.reservedHours} ชม.`, color: "text-sky-600" },
    { label: "เวลาที่ใช้จริง", value: `${summary.usedMinutes} นาที`, color: "text-teal-600" },
    { label: "เครื่องมือที่ใช้", value: `${summary.instrumentCount} ชนิด`, color: "text-indigo-600" },
    {
      label: "คะแนนการใช้งาน",
      value: `${user.score}${locked ? " (ระงับการจอง)" : ""}`,
      color: locked ? "text-red-600" : "text-emerald-600",
    },
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("th-TH") : "-";

  return (
    <div className="space-y-6">
      <Link href="/users" className="text-sm text-slate-500 hover:text-slate-700">
        ← กลับไปจัดการผู้ใช้
      </Link>

      {/* User header */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {user.isActive ? "ใช้งาน" : "ถูกระงับ"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} • {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            {[user.studentId, user.className, user.phone].filter(Boolean).join(" • ") || "-"}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        สมัครใช้งานครั้งแรก: {fmtDate(summary.firstBookingAt)} • ใช้งานล่าสุด:{" "}
        {fmtDate(summary.lastBookingAt)}
      </p>

      <UserUsageCharts data={data} />

      {/* Score history */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">ประวัติการปรับคะแนน</h3>
          <span className="text-xs text-slate-500">ล่าสุด {scoreLogs.length} รายการ</span>
        </div>
        {scoreLogs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            ยังไม่มีประวัติการปรับคะแนน
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {scoreLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <span
                  className={`inline-flex w-fit shrink-0 items-center rounded-md px-2 py-1 text-xs font-bold tabular-nums ${
                    log.change >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {log.change >= 0 ? `+${log.change}` : log.change}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{log.reason}</p>
                  <p className="text-xs text-slate-500">
                    {SCORE_SOURCE_LABELS[log.source] ?? log.source}
                    {log.performedBy ? ` • โดย ${log.performedBy.name}` : ""} •{" "}
                    {log.createdAt.toLocaleDateString("th-TH")}{" "}
                    {log.createdAt.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    • คะแนนรวม {log.scoreAfter}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Booking history */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">ประวัติการจองล่าสุด</h3>
          <span className="text-xs text-slate-500">{summary.totalBookings} รายการ</span>
        </div>
        {data.recentBookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            ผู้ใช้นี้ยังไม่มีการจอง
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentBookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 tabular-nums">
                  {b.date.toLocaleDateString("th-TH")} • {b.startTime}-{b.endTime}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {b.instrument.name}
                  </p>
                  {b.purpose && <p className="text-xs text-slate-500">{b.purpose}</p>}
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
