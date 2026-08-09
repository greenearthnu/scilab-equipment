"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLES, ROLE_LABELS, type Role } from "@scilab/shared";
import { logout } from "@/lib/actions/auth";

interface NavbarProps {
  userName: string;
  userRole: Role;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/instruments", label: "เครื่องมือ" },
  { href: "/bookings", label: "การจอง" },
] as const;

export default function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-bold text-emerald-700">
            🔬 SciLab Booking
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight text-slate-900">
              {userName}
            </p>
            <p className="text-xs leading-tight text-slate-500">
              {ROLE_LABELS[userRole]}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
      <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-1 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1 text-sm ${
              isActive(link.href)
                ? "bg-emerald-50 font-medium text-emerald-700"
                : "text-slate-600"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
