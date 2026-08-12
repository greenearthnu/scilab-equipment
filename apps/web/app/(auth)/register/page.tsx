import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          ← กลับหน้าแรก
        </Link>
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🔬</div>
          <h1 className="text-xl font-bold text-slate-900">
            สมัครสมาชิกนักเรียน
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            กรอกข้อมูลเพื่อสร้างบัญชีสำหรับการจองเครื่องมือ
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
