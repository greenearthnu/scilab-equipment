import type { Metadata } from "next";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { getReportData } from "@/lib/stats";
import ReportsClient from "@/components/reports/reports-client";

export const metadata: Metadata = {
  title: "รายงานสถิติ",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (user.role !== ROLES.EXECUTIVE && user.role !== ROLES.LAB_ADMIN) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้บริหารและผู้ดูแลห้องแล็บเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  const data = await getReportData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานสถิติการใช้งาน</h1>
          <p className="mt-1 text-slate-600">
            สรุปการใช้เครื่องมือห้องปฏิบัติการวิทยาศาสตร์
          </p>
        </div>
        <a
          href="/api/reports/export"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          ⬇ ดาวน์โหลดรายงาน (CSV)
        </a>
      </div>

      <ReportsClient data={data} />
    </div>
  );
}
