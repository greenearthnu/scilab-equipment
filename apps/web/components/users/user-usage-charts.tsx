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
  type BookingStatus,
} from "@scilab/shared";
import type { UserUsageData } from "@/lib/user-usage";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  CANCELLED: "#94a3b8",
  CHECKED_OUT: "#3b82f6",
  COMPLETED: "#64748b",
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

export default function UserUsageCharts({ data }: { data: UserUsageData }) {
  const statusData = data.statusCounts.map((s) => ({
    name: BOOKING_STATUS_LABELS[s.status as BookingStatus] ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status],
  }));

  const instrumentData = data.topInstruments.map((i) => ({
    name: i.name,
    count: i.count,
  }));

  const trendData = data.monthlyTrend.map((m) => {
    const [y, mm] = m.month.split("-").map(Number);
    const label = new Date(y ?? 0, (mm ?? 1) - 1, 1).toLocaleDateString("th-TH", {
      month: "short",
      year: "numeric",
    });
    return { name: label, count: m.count };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="สถานะการจอง">
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

      <ChartCard title="เครื่องมือที่ใช้บ่อยที่สุด">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={instrumentData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="แนวโน้มการจอง 6 เดือนล่าสุด">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3, fill: "#059669" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="เครื่องมือที่ใช้บ่อยที่สุด (ครั้ง)">
        <ul className="divide-y divide-slate-100">
          {data.topInstruments.map((i, idx) => (
            <li key={i.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate text-sm text-slate-700">{i.name}</span>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {i.count} ครั้ง
              </span>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
