"use client";

import { useEffect, useState } from "react";

interface WaitlistEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "WAITING" | "ACTIVE";
  instrument: { id: string; name: string };
}

function dateLabel(d: string): string {
  return new Date(d).toLocaleDateString("th-TH");
}

export default function WaitlistSection() {
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/waitlist");
        const data = await res.json();
        if (!cancelled && res.ok) setEntries(data.entries ?? []);
        else if (!cancelled) setError(true);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function cancel(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/waitlist/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
      }
    } finally {
      setCancelling(null);
    }
  }

  if (error) return null;
  if (entries === null || entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-white">
      <div className="border-b border-amber-100 px-5 py-3">
        <h2 className="font-semibold text-slate-900">
          ⏳ คิวรอของฉัน ({entries.length})
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
          >
            <div className="text-sm">
              <p className="font-medium text-slate-800">{e.instrument.name}</p>
              <p className="text-xs text-slate-500">
                {dateLabel(e.date)} · {e.startTime}–{e.endTime} น. ·{" "}
                {e.status === "ACTIVE" ? (
                  <span className="font-medium text-emerald-600">
                    ว่างแล้ว — ไปจองได้เลย
                  </span>
                ) : (
                  "รอคิว..."
                )}
              </p>
            </div>
            <button
              type="button"
              disabled={cancelling === e.id}
              onClick={() => cancel(e.id)}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelling === e.id ? "กำลังยกเลิก..." : "ออกจากคิว"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
