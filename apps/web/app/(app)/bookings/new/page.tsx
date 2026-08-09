import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import BookingForm from "@/components/bookings/booking-form";

export const metadata: Metadata = {
  title: "จองเครื่องมือ",
};

interface NewBookingPageProps {
  searchParams: Promise<{ instrumentId?: string }>;
}

export default async function NewBookingPage({
  searchParams,
}: NewBookingPageProps) {
  const { instrumentId } = await searchParams;
  const instruments = await db.instrument.findMany({
    where: { status: "AVAILABLE" },
    select: {
      id: true,
      name: true,
      category: true,
      availableCount: true,
      location: true,
    },
    orderBy: { name: "asc" },
  });

  const defaultInstrumentId = instruments.some((i) => i.id === instrumentId)
    ? instrumentId
    : undefined;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/bookings"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← กลับ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          จองเครื่องมือ
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          เลือกเครื่องมือและช่วงเวลา ระบบจะเช็คความซ้ำซ้อนให้อัตโนมัติ
        </p>
      </div>

      {instruments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          ยังไม่มีเครื่องมือที่พร้อมใช้งาน
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <BookingForm
            instruments={instruments}
            defaultInstrumentId={defaultInstrumentId}
          />
        </div>
      )}
    </div>
  );
}
