import type { Metadata } from "next";
import Link from "next/link";
import { isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import InstrumentForm from "@/components/instruments/instrument-form";

export const metadata: Metadata = {
  title: "เพิ่มเครื่องมือ",
};

export default async function NewInstrumentPage() {
  const user = await getCurrentUser();

  if (!isAdminRole(user.role)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/instruments"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← กลับ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          เพิ่มเครื่องมือใหม่
        </h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <InstrumentForm />
      </div>
    </div>
  );
}
