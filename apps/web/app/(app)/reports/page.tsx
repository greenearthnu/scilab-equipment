import type { Metadata } from "next";
import { ROLES, isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { getReportData } from "@/lib/stats";
import ReportsClient from "@/components/reports/reports-client";
import PrintButton from "@/components/print-button";

export const metadata: Metadata = {
  title: "รายงานสถิติ",
};

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface ReportsPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getCurrentUser();

  if (user.role !== ROLES.EXECUTIVE && !isAdminRole(user.role)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้บริหารและผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  const params = await searchParams;
  const from = parseDate(params.from ?? null);
  const to = parseDate(params.to ?? null);

  const data = await getReportData(from, to);

  const fromStr = params.from ?? "";
  const toStr = params.to ?? "";
  const trendTitle =
    fromStr || toStr ? "แนวโน้มการจองตามช่วงวันที่ที่เลือก" : "แนวโน้มการจอง 14 วันล่าสุด";
  const rangeQs = new URLSearchParams();
  if (fromStr) rangeQs.set("from", fromStr);
  if (toStr) rangeQs.set("to", toStr);
  const rangeQuery = rangeQs.toString();
  const exportUrl = `/api/reports/export${rangeQuery ? `?${rangeQuery}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รายงานสถิติการใช้งาน</h1>
          <p className="mt-1 text-slate-600">
            สรุปการใช้เครื่องมือห้องปฏิบัติการวิทยาศาสตร์
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <a
            href={exportUrl}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 print:hidden"
          >
            ⬇ ดาวน์โหลดรายงาน (CSV)
          </a>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 print:hidden"
      >
        <div>
          <label
            htmlFor="from"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ตั้งแต่วันที่
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromStr}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="to"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ถึงวันที่
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toStr}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900"
        >
          กรองช่วงวันที่
        </button>
        <a
          href="/reports"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          ล้าง
        </a>
        {from || to ? (
          <p className="w-full text-xs text-slate-500">
            แสดงข้อมูลช่วงวันที่{" "}
            {from
              ? from.toLocaleDateString("th-TH")
              : "เริ่มแรก"}{" "}
            –{" "}
            {to
              ? to.toLocaleDateString("th-TH")
              : "ล่าสุด"}{" "}
            (ตัวเลขเครื่องมือคงเป็นค่าล่าสุด)
          </p>
        ) : (
          <p className="w-full text-xs text-slate-400">
            ไม่กรอง = แสดงข้อมูลทั้งหมด
          </p>
        )}
      </form>

      <ReportsClient data={data} trendTitle={trendTitle} />
    </div>
  );
}
