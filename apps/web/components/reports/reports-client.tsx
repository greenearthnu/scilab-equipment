"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  BOOKING_STATUS_LABELS,
  INSTRUMENT_CATEGORY_LABELS,
  type InstrumentCategory,
  type BookingStatus,
} from "@scilab/shared";
import type { ReportData } from "@/lib/stats";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  CANCELLED: "#94a3b8",
  CHECKED_OUT: "#3b82f6",
  COMPLETED: "#64748b",
};

const CATEGORY_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

export default function ReportsClient({
  data,
  trendTitle = "แนวโน้มการจอง 14 วันล่าสุด",
}: {
  data: ReportData;
  trendTitle?: string;
}) {
  const statusData = data.statusCounts.map((s) => ({
    name: BOOKING_STATUS_LABELS[s.status as BookingStatus] ?? s.status,
    count: s.count,
    color: STATUS_COLORS[s.status],
  }));

  const categoryData = data.categoryUsage.map((c) => ({
    name: INSTRUMENT_CATEGORY_LABELS[c.category as InstrumentCategory] ?? c.category,
    count: c.count,
  }));

  const timeSlotData = data.timeSlotUsage.map((t) => ({
    name: `${t.time} น.`,
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="การจองทั้งหมด"
          value={data.totalBookings}
          color="text-blue-600"
        />
        <StatCard
          label="อนุมัติแล้ว"
          value={data.approvedCount}
          color="text-emerald-600"
        />
        <StatCard
          label="เสร็จสิ้น"
          value={data.completedCount}
          color="text-slate-700"
        />
        <StatCard
          label="เครื่องมือพร้อมใช้"
          value={`${data.activeInstruments}/${data.instrumentCount}`}
          color="text-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="เครื่องมือที่ถูกจองมากที่สุด">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topInstruments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="สถานะการจอง">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={statusData}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
                {statusData.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="การใช้งานแยกตามหมวดหมู่">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
                {categoryData.map((c, i) => (
                  <Cell
                    key={i}
                    fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="การใช้งานแยกตามช่วงเวลา (ชั่วโมงเริ่มใช้งาน)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={timeSlotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title={trendTitle}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
