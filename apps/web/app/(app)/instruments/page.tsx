import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import { ROLES, INSTRUMENT_CATEGORY_LABELS } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { setInstrumentStatus } from "@/lib/actions/instruments";
import { InstrumentStatusBadge } from "@/components/status-badge";

export const metadata: Metadata = {
  title: "เครื่องมือ",
};

export default async function InstrumentsPage() {
  const user = await getCurrentUser();
  const instruments = await db.instrument.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เครื่องมือวิทยาศาสตร์</h1>
          <p className="mt-1 text-slate-600">
            รายการเครื่องมือและอุปกรณ์ในห้องปฏิบัติการ
          </p>
        </div>
        {user.role === ROLES.LAB_ADMIN && (
          <Link
            href="/instruments/new"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            + เพิ่มเครื่องมือ
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {instruments.map((instrument) => (
          <div
            key={instrument.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="font-semibold text-slate-900">
                {instrument.name}
              </h2>
              <InstrumentStatusBadge status={instrument.status} />
            </div>
            <p className="text-xs font-medium text-emerald-600">
              {INSTRUMENT_CATEGORY_LABELS[instrument.category]}
            </p>
            {instrument.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {instrument.description}
              </p>
            )}
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p>
                จำนวน: {instrument.availableCount}/{instrument.totalQuantity}{" "}
                ชิ้น
              </p>
              {instrument.location && <p>สถานที่: {instrument.location}</p>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              {instrument.status === "AVAILABLE" && (
                <Link
                  href={`/bookings/new?instrumentId=${instrument.id}`}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  จอง
                </Link>
              )}
              {user.role === ROLES.LAB_ADMIN && (
                <div className="ml-auto flex items-center gap-1">
                  {(["AVAILABLE", "MAINTENANCE", "DISABLED"] as const).map(
                    (status) => (
                      <form
                        key={status}
                        action={async () => {
                          "use server";
                          await setInstrumentStatus(instrument.id, status);
                        }}
                      >
                        <button
                          type="submit"
                          disabled={instrument.status === status}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          {status === "AVAILABLE"
                            ? "พร้อม"
                            : status === "MAINTENANCE"
                              ? "ซ่อม"
                              : "ปิด"}
                        </button>
                      </form>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {instruments.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          ยังไม่มีเครื่องมือในระบบ
        </p>
      )}
    </div>
  );
}
