import type { Metadata } from "next";
import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl">🔬</div>
          <h1 className="text-xl font-bold text-slate-900">
            ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            เข้าสู่ระบบเพื่อเริ่มใช้งาน
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
