"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createBooking,
  type BookingFormState,
} from "@/lib/actions/bookings";
import { rangesOverlap, type TimeRange } from "@scilab/shared";
import type { Instrument } from "@scilab/db";

interface BookingFormProps {
  instruments: Pick<
    Instrument,
    "id" | "name" | "category" | "availableCount" | "location"
  >[];
  defaultInstrumentId?: string;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function BookingForm({
  instruments,
  defaultInstrumentId,
}: BookingFormProps) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(
    createBooking,
    undefined
  );
  const [instrumentId, setInstrumentId] = useState(defaultInstrumentId ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [takenRanges, setTakenRanges] = useState<TimeRange[]>([]);
  const [availabilityError, setAvailabilityError] = useState(false);

  useEffect(() => {
    if (!instrumentId || !date) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/bookings/availability?instrumentId=${encodeURIComponent(
            instrumentId
          )}&date=${encodeURIComponent(date)}`,
          { signal: controller.signal }
        );
        if (cancelled) return;
        if (!res.ok) {
          setAvailabilityError(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setTakenRanges(data.takenRanges as TimeRange[]);
        setAvailabilityError(false);
      } catch {
        if (cancelled) return;
        setAvailabilityError(true);
      }
    }, 250);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [instrumentId, date]);

  const hasStartEnd = startTime && endTime;
  const selectedRange: TimeRange | null =
    hasStartEnd && startTime < endTime
      ? { startTime, endTime }
      : null;
  const conflicts = selectedRange
    ? takenRanges.filter((r) => rangesOverlap(r, selectedRange))
    : [];
  const unavailable =
    instrumentId && date && !availabilityError ? takenRanges : [];

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="instrumentId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          เครื่องมือ
        </label>
        <select
          id="instrumentId"
          name="instrumentId"
          required
          value={instrumentId}
          onChange={(e) => setInstrumentId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="" disabled>
            กรุณาเลือกเครื่องมือ
          </option>
          {instruments.map((instrument) => (
            <option key={instrument.id} value={instrument.id}>
              {instrument.name} ({instrument.availableCount} ชิ้น)
            </option>
          ))}
        </select>
        {state?.errors?.instrumentId && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.instrumentId[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="date"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          วันที่ต้องการใช้
        </label>
        <input
          id="date"
          name="date"
          type="date"
          min={todayString()}
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.date && (
          <p className="mt-1 text-xs text-red-600">{state.errors.date[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startTime"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            เวลาเริ่ม
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {state?.errors?.startTime && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.startTime[0]}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            เวลาสิ้นสุด
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {state?.errors?.endTime && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.endTime[0]}
            </p>
          )}
        </div>
      </div>

      {hasStartEnd && startTime >= endTime && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม
        </p>
      )}

      {instrumentId && date && !availabilityError && (
        <div>
          <p className="mb-1 text-xs text-slate-500">
            ช่วงเวลาที่ถูกจองแล้วในวันนี้ ({unavailable.length} ช่วง)
          </p>
          {unavailable.length === 0 ? (
            <p className="text-xs text-emerald-600">ไม่มีช่วงเวลาที่ถูกจอง</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {unavailable.map((r, i) => (
                <li
                  key={i}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {r.startTime}-{r.endTime}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {availabilityError && (
        <p className="text-xs text-red-600">
          ไม่สามารถตรวจสอบช่วงเวลาที่ถูกจองได้ในขณะนี้
        </p>
      )}

      {selectedRange && conflicts.length > 0 && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          ช่วงเวลานี้ทับซ้อนกับการจอง {conflicts.length} ช่วง กรุณาเลือกเวลาอื่น
        </p>
      )}

      <div>
        <label
          htmlFor="purpose"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          วัตถุประสงค์การใช้งาน
        </label>
        <textarea
          id="purpose"
          name="purpose"
          rows={3}
          placeholder="เช่น ใช้ประกอบการทดลองเรื่องเซลล์พืช"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.purpose && (
          <p className="mt-1 text-xs text-red-600">{state.errors.purpose[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || conflicts.length > 0}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "กำลังส่งคำขอ..." : "ส่งคำขอจอง"}
      </button>
    </form>
  );
}
