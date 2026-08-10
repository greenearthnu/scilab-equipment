"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import {
  uploadEvidence,
  type EvidenceFormState,
} from "@/lib/actions/bookings";

interface EvidenceBooking {
  id: string;
  status: string;
  evidenceUrl: string | null;
}

export default function EvidenceForm({ booking }: { booking: EvidenceBooking }) {
  const [state, action, pending] = useActionState<EvidenceFormState, FormData>(
    uploadEvidence,
    undefined
  );
  const [showForm, setShowForm] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showForm && !booking.evidenceUrl) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
      >
        📷 อัปโหลดรูปหลักฐาน
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {booking.evidenceUrl ? (
        <a
          href={booking.evidenceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
        >
          🖼️ ดูรูปหลักฐาน
        </a>
      ) : null}
      {showForm && (
        <form action={action} className="flex flex-col gap-1.5">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input
            ref={fileInputRef}
            type="file"
            name="evidence"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) =>
              setFileName(e.target.files?.[0]?.name ?? null)
            }
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          >
            {fileName ?? "เลือกไฟล์รูป"}
          </button>
          {state?.errors?.evidence && (
            <p className="text-xs text-red-600">{state.errors.evidence[0]}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "กำลังอัปโหลด..." : "บันทึกรูป"}
          </button>
        </form>
      )}
      {state?.message && (
        <p className="text-xs text-emerald-700">{state.message}</p>
      )}
    </div>
  );
}
