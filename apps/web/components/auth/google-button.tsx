"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "ยังไม่ได้ตั้งค่า Google Sign-in กรุณาติดต่อผู้ดูแล",
  access_denied: "ยกเลิกหรือไม่อนุญาตการเข้าสู่ระบบด้วย Google",
  invalid: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่",
  domain: "กรุณาเข้าสู่ระบบด้วยอีเมลโดเมนของโรงเรียน (เช่น @school.ac.th)",
  disabled: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลห้องแล็บ",
};

function GoogleSignInError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {ERROR_MESSAGES[error] ?? "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่"}
    </p>
  );
}

export default function GoogleSignInButton() {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleSignInError />
      </Suspense>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase text-slate-400">
          <span className="bg-white px-2">หรือ</span>
        </div>
      </div>
      {/* ใช้ <a> ธรรมดา (ไม่ใช่ next/link) เพราะ /api/auth/google เป็น API route —
          next/link จะพยายาม fetch แบบ client-side แล้ว redirect ข้าม origin โดน CORS บล็อก */}
      <a
        href="/api/auth/google"
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.7 16.3 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C36.9 40.1 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"
          />
        </svg>
        เข้าสู่ระบบด้วย Google
      </a>
    </>
  );
}
