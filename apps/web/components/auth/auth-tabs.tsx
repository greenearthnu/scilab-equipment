"use client";

import { useState } from "react";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import GoogleSignInButton from "./google-button";

type Tab = "login" | "register";

export default function AuthTabs({ initialTab = "login" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "login"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "register"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>
      {tab === "login" ? <LoginForm /> : <RegisterForm />}
      <GoogleSignInButton />
    </div>
  );
}
