"use client";

import { useActionState, useState } from "react";
import {
  createBooking,
  type BookingFormState,
} from "@/lib/actions/bookings";
import { TIME_SLOTS } from "@scilab/shared";
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
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

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
          defaultValue={defaultInstrumentId ?? ""}
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.date && (
          <p className="mt-1 text-xs text-red-600">{state.errors.date[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          ช่วงเวลา (คาบเรียน) — เลือกได้หลายคาบ
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {TIME_SLOTS.map((slot) => {
            const selected = selectedSlots.includes(slot.id);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                className={`rounded-md border px-3 py-2 text-left transition-colors ${
                  selected
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-medium text-slate-800">
                  {slot.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {slot.start}-{slot.end}
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="timeSlots" value={selectedSlots.join(",")} />
        {selectedSlots.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">
            ยังไม่ได้เลือกช่วงเวลา
          </p>
        )}
        {state?.errors?.timeSlots && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.timeSlots[0]}
          </p>
        )}
      </div>

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
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "กำลังส่งคำขอ..." : "ส่งคำขอจอง"}
      </button>
    </form>
  );
}
