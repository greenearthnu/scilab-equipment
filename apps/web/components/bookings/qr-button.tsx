"use client";

import { useState } from "react";
import BookingQrModal from "./booking-qr-modal";

export default function QrButton({
  bookingId,
  title,
}: {
  bookingId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
      >
        QR
      </button>
      {open && (
        <BookingQrModal
          bookingId={bookingId}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
