"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, isAdminRole, type Role } from "@scilab/shared";
import { logout } from "@/lib/actions/auth";

interface NavbarProps {
  userName: string;
  userRole: Role;
  avatarUrl?: string | null;
  unreadCount?: number;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/instruments", label: "เครื่องมือ" },
  { href: "/calendar", label: "ปฏิทิน" },
  { href: "/bookings", label: "การจอง" },
  { href: "/history", label: "ประวัติ" },
  { href: "/profile", label: "โปรไฟล์" },
] as const;

const REPORT_LINK = { href: "/reports", label: "รายงาน" } as const;
const USERS_LINK = { href: "/users", label: "ผู้ใช้" } as const;
const PROJECTS_LINK = { href: "/projects", label: "โครงงาน" } as const;

const linkClass = (active: boolean) =>
  `rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-emerald-50 text-emerald-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function Navbar({
  userName,
  userRole,
  avatarUrl,
  unreadCount = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const showManageLinks = userRole === "EXECUTIVE" || isAdminRole(userRole);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="shrink-0 text-sm font-bold text-emerald-700"
          >
            🔬 SciLab Booking
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            ))}
            {showManageLinks && (
              <Link
                href={REPORT_LINK.href}
                className={linkClass(isActive(REPORT_LINK.href))}
              >
                {REPORT_LINK.label}
              </Link>
            )}
            {isAdminRole(userRole) && (
              <>
                <Link
                  href={PROJECTS_LINK.href}
                  className={linkClass(isActive(PROJECTS_LINK.href))}
                >
                  {PROJECTS_LINK.label}
                </Link>
                <Link
                  href={USERS_LINK.href}
                  className={linkClass(isActive(USERS_LINK.href))}
                >
                  {USERS_LINK.label}
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/notifications"
            aria-label="การแจ้งเตือน"
            className="relative shrink-0 rounded-md border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.5 w-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-center gap-2.5"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-100"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium leading-tight text-slate-900">
                {userName}
              </p>
              <p className="text-xs leading-tight text-slate-500">
                {ROLE_LABELS[userRole]}
              </p>
            </div>
          </Link>

          {/* Hamburger — จอเล็กกว่า md */}
          <button
            type="button"
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          <form action={logout}>
            <button
              type="submit"
              className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 sm:px-3 sm:text-sm"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>

      {/* เมนูมือถือ (dropdown) */}
      {menuOpen && (
        <div className="relative md:hidden">
          <div
            className="fixed inset-0 z-20 bg-slate-900/30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute inset-x-0 top-full z-30 border-t border-slate-100 bg-white shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                เมนูหลัก
              </p>
              <div className="grid gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {showManageLinks && (
                <>
                  <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    จัดการ
                  </p>
                  <div className="grid gap-1">
                    <Link
                      href={REPORT_LINK.href}
                      onClick={() => setMenuOpen(false)}
                      className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(REPORT_LINK.href)
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {REPORT_LINK.label}
                    </Link>
                    {isAdminRole(userRole) && (
                      <>
                        <Link
                          href={PROJECTS_LINK.href}
                          onClick={() => setMenuOpen(false)}
                          className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive(PROJECTS_LINK.href)
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {PROJECTS_LINK.label}
                        </Link>
                        <Link
                          href={USERS_LINK.href}
                          onClick={() => setMenuOpen(false)}
                          className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive(USERS_LINK.href)
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {USERS_LINK.label}
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
