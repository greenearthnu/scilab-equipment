import Link from "next/link";
import { db } from "@scilab/db";
import { ROLES, ROLE_LABELS, isAdminRole, formatTimeRange } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { getReportData } from "@/lib/stats";
import DashboardCharts from "@/components/dashboard/dashboard-charts";
import { ScoreBadge } from "@/components/score-badge";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const isTeacherOrAdmin =
    user.role === ROLES.TEACHER || isAdminRole(user.role);
  const isLabAdmin = isAdminRole(user.role);
  const isExecutive = user.role === ROLES.EXECUTIVE;

  const [instrumentCount, pendingCount, myBookings, upcomingBookings, reportData] =
    await Promise.all([
      db.instrument.count({ where: { status: "AVAILABLE" } }),
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.findMany({
        where: { userId: user.id },
        include: { instrument: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
      db.booking.findMany({
        where: { date: { gte: new Date() }, status: "APPROVED" },
        include: { user: true, instrument: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
      isTeacherOrAdmin || isExecutive ? getReportData() : Promise.resolve(null),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          สวัสดี, {user.name}
        </h1>
        <p className="mt-1 text-slate-600">
          ยินดีต้อนรับสู่ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์ ({ROLE_LABELS[user.role]})
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">เครื่องมือที่พร้อมใช้งาน</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {instrumentCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">รายการ</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">คำขอยากำลังรออนุมัติ</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">คำขอ</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">การจองของฉัน</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">
            {myBookings.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">รายการล่าสุด</p>
        </div>
      </div>

      {(isTeacherOrAdmin || isExecutive) && reportData && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            สถิติภาพรวมการใช้งาน
          </h2>
          <DashboardCharts data={reportData} />
        </section>
      )}

      {!isExecutive && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/bookings/new"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            + จองเครื่องมือ
          </Link>
          {isLabAdmin && (
            <Link
              href="/instruments/new"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              + เพิ่มเครื่องมือ
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">การจองล่าสุดของฉัน</h2>
          </div>
          {myBookings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              ยังไม่มีการจองเครื่องมือ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myBookings.map((b) => (
                <li key={b.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-slate-800">
                    {b.instrument.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.date.toLocaleDateString("th-TH")} •{" "}
                    {formatTimeRange({ startTime: b.startTime, endTime: b.endTime })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(isTeacherOrAdmin || isExecutive) && (
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="font-semibold text-slate-900">
                การจองที่อนุมัติแล้ว (เร็วๆ นี้)
              </h2>
            </div>
            {upcomingBookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                ยังไม่มีการจองที่อนุมัติ
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingBookings.map((b) => (
                  <li key={b.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-slate-800">
                      {b.instrument.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.user.name} <ScoreBadge score={b.user.score} /> •{" "}
                      {b.date.toLocaleDateString("th-TH")} •{" "}
                      {formatTimeRange({ startTime: b.startTime, endTime: b.endTime })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
