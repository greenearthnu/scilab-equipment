import type { InstrumentStatus, BookingStatus } from "@scilab/shared";
import {
  INSTRUMENT_STATUS_LABELS,
  BOOKING_STATUS_LABELS,
} from "@scilab/shared";

const INSTRUMENT_STATUS_COLORS: Record<InstrumentStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  DISABLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  CHECKED_OUT: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
};

export function InstrumentStatusBadge({
  status,
}: {
  status: InstrumentStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${INSTRUMENT_STATUS_COLORS[status]}`}
    >
      {INSTRUMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS_COLORS[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
