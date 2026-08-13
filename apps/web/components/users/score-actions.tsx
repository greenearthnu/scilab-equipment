"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustUserScore, unlockUserBooking } from "@/lib/actions/users";
import Dropdown from "@/components/dropdown";

const DELTA_OPTIONS = [-20, -10, -5, 0, 5, 10, 20] as const;

export function ScoreActions({
  userId,
  locked,
}: {
  userId: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (formData: FormData) => Promise<unknown>, formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn(formData);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Dropdown trigger="ปรับคะแนน">
        <form
          action={(fd) => run(adjustUserScore, fd)}
          className="space-y-2"
        >
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label
              htmlFor={`delta-${userId}`}
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              เพิ่ม/หักคะแนน
            </label>
            <select
              id={`delta-${userId}`}
              name="delta"
              defaultValue="0"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            >
              {DELTA_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d > 0 ? `+${d}` : d}
                </option>
              ))}
            </select>
          </div>
          <input
            name="reason"
            placeholder="เหตุผล (ไม่บังคับ)"
            maxLength={200}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
          >
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      </Dropdown>

      {locked && (
        <button
          type="button"
          onClick={() => {
            const fd = new FormData();
            fd.set("userId", userId);
            run(unlockUserBooking, fd);
          }}
          disabled={isPending}
          className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
        >
          ปลดล็อกการจอง
        </button>
      )}

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
