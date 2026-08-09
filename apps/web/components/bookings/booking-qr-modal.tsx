"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface BookingQrModalProps {
  bookingId: string;
  title: string;
  onClose: () => void;
}

export default function BookingQrModal({
  bookingId,
  title,
  onClose,
}: BookingQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(bookingId, { width: 220, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [bookingId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          ให้ผู้ดูแลห้องแล็บสแกน QR เพื่อเช็คอิน
        </p>
        <div className="mt-4 flex items-center justify-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code" className="h-56 w-56" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center text-sm text-slate-400">
              กำลังสร้าง QR...
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
