import { db } from "@scilab/db";
import {
  addMaintenance,
  updateMaintenanceStatus,
  deleteMaintenance,
} from "@/lib/actions/maintenance";
import { MAINTENANCE_STATUS_LABELS } from "@scilab/shared";

const statusOrder = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function MaintenanceSection({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const [instruments, records] = await Promise.all([
    db.instrument.findMany({
      where: { status: { in: ["AVAILABLE", "MAINTENANCE"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.maintenanceRecord.findMany({
      include: { instrument: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 30,
    }),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const active = records.filter((r) =>
    ["SCHEDULED", "IN_PROGRESS"].includes(r.status)
  );
  const history = records.filter((r) =>
    ["COMPLETED", "CANCELLED"].includes(r.status)
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">🛠️ การซ่อมบำรุง</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          กำหนดการซ่อมจะกันการจองในช่วงเวลานั้นอัตโนมัติ
        </p>
      </div>

      {isAdmin && instruments.length > 0 && (
        <form
          action={addMaintenance}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              เครื่องมือ
            </label>
            <select
              name="instrumentId"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="" disabled>
                เลือกเครื่องมือ
              </option>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              หัวข้อการซ่อม
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="เช่น เปลี่ยนเลนส์ หลอดไฟเสีย"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              วันที่
            </label>
            <input
              name="date"
              type="date"
              required
              min={today}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                เริ่ม
              </label>
              <input
                name="startTime"
                type="time"
                required
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                ถึง
              </label>
              <input
                name="endTime"
                type="time"
                required
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <input
              name="description"
              type="text"
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              + เพิ่มกำหนดการซ่อม
            </button>
          </div>
        </form>
      )}

      {active.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-2.5">วันที่</th>
                <th className="px-4 py-2.5">เครื่องมือ</th>
                <th className="px-4 py-2.5">หัวข้อ</th>
                <th className="px-4 py-2.5">เวลา</th>
                <th className="px-4 py-2.5">สถานะ</th>
                {isAdmin && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 text-slate-700">
                    {r.date.toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {r.instrument.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {r.title}
                    {r.description && (
                      <span className="block text-xs text-slate-400">
                        {r.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {r.startTime}–{r.endTime} น.
                  </td>
                  <td className="px-4 py-2.5">
                    {isAdmin ? (
                      <form action={updateMaintenanceStatus} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={r.id} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          onChange={(e) => e.target.form?.requestSubmit()}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        >
                          {statusOrder.map((s) => (
                            <option key={s} value={s}>
                              {MAINTENANCE_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </form>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">
                        {MAINTENANCE_STATUS_LABELS[r.status]}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <form action={deleteMaintenance}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          ลบ
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
          ไม่มีการซ่อมบำรุงในช่วงนี้
        </p>
      )}

      {history.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
            ประวัติการซ่อมที่ผ่านมา ({history.length})
          </summary>
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[560px] text-sm">
              <tbody className="divide-y divide-slate-100">
                {history.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-slate-600">
                      {r.date.toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-700">
                      {r.instrument.name}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{r.title}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.startTime}–{r.endTime} น.
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {MAINTENANCE_STATUS_LABELS[r.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
