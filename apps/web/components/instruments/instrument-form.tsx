"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createInstrument,
  type InstrumentFormState,
} from "@/lib/actions/instruments";
import {
  INSTRUMENT_CATEGORY,
  INSTRUMENT_CATEGORY_LABELS,
  type InstrumentCategory,
} from "@scilab/shared";

export default function InstrumentForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    InstrumentFormState,
    FormData
  >(createInstrument, undefined);

  return (
    <form
      action={async (formData: FormData) => {
        const result = await action(formData);
        if (result && !result.message) {
          router.push("/instruments");
          router.refresh();
        }
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ชื่อเครื่องมือ
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="เช่น กล้องจุลทรรศน์แบบใช้แสง"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          หมวดหมู่
        </label>
        <select
          id="category"
          name="category"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {(Object.keys(INSTRUMENT_CATEGORY) as InstrumentCategory[]).map(
            (cat) => (
              <option key={cat} value={cat}>
                {INSTRUMENT_CATEGORY_LABELS[cat]}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label
          htmlFor="totalQuantity"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          จำนวนชิ้น
        </label>
        <input
          id="totalQuantity"
          name="totalQuantity"
          type="number"
          min={1}
          defaultValue={1}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.totalQuantity && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.totalQuantity[0]}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="location"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          สถานที่จัดเก็บ
        </label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="เช่น ห้องแล็บ 1"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.location && (
          <p className="mt-1 text-xs text-red-600">{state.errors.location[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รายละเอียด
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.description && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.description[0]}
          </p>
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
        {pending ? "กำลังบันทึก..." : "บันทึกเครื่องมือ"}
      </button>
    </form>
  );
}
