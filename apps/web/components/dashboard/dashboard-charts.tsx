"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BOOKING_STATUS_LABELS,
  formatTimeSlot,
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

export default function DashboardCharts({ data }: { data: ReportData }) {
  const statusData = data.statusCounts.map((s) => ({
    name: BOOKING_STATUS_LABELS[s.status as BookingStatus] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status],
  }));

  const timeSlotData = data.timeSlotUsage.map((t) => ({
    name: formatTimeSlot(t.timeSlot),
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="สถานะการจองทั้งหมด">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                label={(entry) => `${entry.value}`}
              >
                {statusData.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="แนวโน้มการจอง 14 วันล่าสุด">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="เครื่องมือที่ถูกจองมากที่สุด">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topInstruments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                width={30}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="การใช้งานแยกตามคาบเรียน">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeSlotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                width={30}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
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
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
