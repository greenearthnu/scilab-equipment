"use client";

import { useActionState } from "react";
import {
  updateScoreSettings,
  type ScoreSettingsFormState,
} from "@/lib/actions/settings";
import type { ScoreSettings } from "@/lib/score-settings";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const fields: {
  name: keyof ScoreSettings;
  label: string;
  hint: string;
}[] = [
  {
    name: "initialScore",
    label: "คะแนนเริ่มต้นของผู้ใช้ใหม่",
    hint: "เช่น 100 — ผู้ใช้ใหม่ทุกคนเริ่มที่ค่านี้",
  },
  {
    name: "minToBook",
    label: "เกณฑ์ขั้นต่ำสำหรับการจอง",
    hint: "คะแนนต่ำกว่านี้ → ระงับการจองชั่วคราว (ต้องให้ผู้ดูแลปลดล็อก)",
  },
  {
    name: "earlyReturnBonus",
    label: "คะแนนเมื่อคืนเครื่องก่อนเวลา/ตรงเวลา",
    hint: "ให้เมื่อผู้ดูแลอนุมัติคำขอคืนเครื่องก่อนเวลา",
  },
  {
    name: "evidenceBonus",
    label: "คะแนนเมื่ออัปโหลดรูปหลักฐานหลังใช้",
    hint: "ให้ครั้งแรกที่อัปโหลดรูปหลักฐาน (จัดเก็บ/ล้างอุปกรณ์แล้ว)",
  },
  {
    name: "unlockScore",
    label: "คะแนนเมื่อผู้ดูแลปลดล็อกการจอง",
    hint: "คะแนนที่ตั้งให้เมื่อกดปลดล็อก (เช่น 100)",
  },
];

export default function SettingsForm({
  settings,
}: {
  settings: ScoreSettings;
}) {
  const [state, action, pending] = useActionState<
    ScoreSettingsFormState,
    FormData
  >(updateScoreSettings, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">ระบบคะแนนการใช้งาน</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name}>
              <label
                htmlFor={f.name}
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type="number"
                required
                min={f.name === "minToBook" ? 1 : 0}
                max={100}
                defaultValue={settings[f.name]}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">{f.hint}</p>
            </div>
          ))}
        </div>

        {state?.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </form>
  );
}
