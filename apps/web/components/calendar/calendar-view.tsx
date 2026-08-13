"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOOKING_STATUS_LABELS,
  INSTRUMENT_CATEGORY_LABELS,
  type BookingStatus,
} from "@scilab/shared";
import { ScoreBadge } from "@/components/score-badge";

interface CalendarBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string | null;
  instrument: { id: string; name: string; category: string };
  user?: { id: string; name: string; className: string | null; score: number };
}

interface InstrumentOption {
  id: string;
  name: string;
}

interface CalendarViewProps {
  instruments: InstrumentOption[];
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "bg-amber-400",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-400",
  CANCELLED: "bg-slate-300",
  CHECKED_OUT: "bg-blue-500",
  COMPLETED: "bg-slate-500",
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-50 text-slate-500 border-slate-200",
  CHECKED_OUT: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-slate-50 text-slate-600 border-slate-200",
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CalendarView({ instruments }: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [instrumentId, setInstrumentId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar?month=${monthKey(viewDate)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = (await res.json()) as { bookings: CalendarBooking[] };
        if (!cancelled) {
          setBookings(data.bookings);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("ไม่สามารถโหลดปฏิทินได้ในขณะนี้");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewDate]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const key = b.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [bookings]);

  const gridDays = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const selectedBookings = useMemo(() => {
    const list = byDate.get(selectedDate) ?? [];
    const filtered = statusFilter === "ALL" ? list : list.filter((b) => b.status === statusFilter);
    const filteredByInstrument =
      instrumentId === "ALL" ? filtered : filtered.filter((b) => b.instrument.id === instrumentId);
    return filteredByInstrument;
  }, [byDate, selectedDate, statusFilter, instrumentId]);

  const countByStatus = (dateStr: string) => {
    const counts = new Map<BookingStatus, number>();
    for (const b of byDate.get(dateStr) ?? []) {
      if (instrumentId !== "ALL" && b.instrument.id !== instrumentId) continue;
      counts.set(b.status, (counts.get(b.status) ?? 0) + 1);
    }
    return counts;
  };

  const today = todayString();

  const changeMonth = (delta: number) => {
    setLoading(true);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setLoading(true);
    setViewDate(now);
    setSelectedDate(today);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            →
          </button>
          <h2 className="ml-1 text-lg font-bold text-slate-900">
            {viewDate.toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">เครื่องมือทั้งหมด</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="grid min-w-[640px] grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-center text-xs font-semibold text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid min-w-[640px] grid-cols-7">
          {gridDays.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="min-h-20 border-b border-r border-slate-50" />;
            const counts = countByStatus(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-20 border-b border-r border-slate-100 p-2 text-left align-top transition-colors hover:bg-emerald-50 ${
                  isSelected ? "bg-emerald-50 ring-1 ring-inset ring-emerald-300" : ""
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-emerald-600 font-bold text-white" : "text-slate-600"
                  }`}
                >
                  {Number(dateStr.slice(8))}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Array.from(counts.entries()).map(([status, count]) => (
                    <span
                      key={status}
                      className="flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5"
                      title={`${BOOKING_STATUS_LABELS[status]}: ${count}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`} />
                      <span className="text-[10px] text-slate-500">{count}</span>
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {BOOKING_STATUS_LABELS[status as BookingStatus]}
          </span>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">{formatThaiDate(selectedDate)}</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">ทุกสถานะ</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-500">กำลังโหลด...</p>
        ) : selectedBookings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">ไม่มีการจองในวันนี้</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {selectedBookings.map((b) => (
              <li key={b.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 tabular-nums">
                  {b.startTime}-{b.endTime}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{b.instrument.name}</p>
                  <p className="text-xs text-slate-500">
                    {INSTRUMENT_CATEGORY_LABELS[b.instrument.category as keyof typeof INSTRUMENT_CATEGORY_LABELS]}
                    {b.user ? (
                      <>
                        {" • "}
                        {b.user.name}
                        {b.user.className ? ` (${b.user.className})` : ""}{" "}
                        <ScoreBadge score={b.user.score} />
                      </>
                    ) : null}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status]}`}>
                  {BOOKING_STATUS_LABELS[b.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
