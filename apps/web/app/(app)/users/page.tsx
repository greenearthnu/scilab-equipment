import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@scilab/db";
import {
  ROLES,
  ROLE_LABELS,
  isAdminRole,
  canManageAdminRoles,
  isBookingLocked,
  BOOKING_SCORE_MIN_TO_BOOK,
  type Role,
} from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { ScoreActions } from "@/components/users/score-actions";
import {
  toggleUserStatus,
  resetUserPassword,
  updateUserProfile,
  deleteUser,
} from "@/lib/actions/users";
import { RoleSelector } from "@/components/users/role-selector";
import Dropdown from "@/components/dropdown";
import ConfirmSubmitButton from "@/components/confirm-submit-button";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้",
};

interface UsersPageProps {
  searchParams: Promise<{
    role?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

const ALLOWED_ROLES = new Set(Object.values(ROLES));

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await getCurrentUser();
  if (!isAdminRole(currentUser.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const role = ALLOWED_ROLES.has(params.role as never) ? params.role : "ALL";
  const status = params.status === "inactive" ? "inactive" : params.status === "active" ? "active" : "ALL";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(role !== "ALL" ? { role: role as never } : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
        ? { isActive: false }
        : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { className: { contains: q } },
            { studentId: { contains: q } },
          ],
        }
      : {}),
  };

  const total = await db.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const users = await db.user.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const activeCount = await db.user.count({ where: { isActive: true } });
  const totalCount = await db.user.count();

  /** OWNER จัดการได้ทุกบัญชี, LAB_ADMIN จัดการได้เฉพาะบัญชีที่ไม่ใช่ OWNER/LAB_ADMIN (จัดการบัญชีตนเองได้เสมอ) */
  const canManageTarget = (targetId: string, targetRole: Role) =>
    targetId === currentUser.id ||
    canManageAdminRoles(currentUser.role) ||
    !isAdminRole(targetRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้</h1>
          <p className="mt-1 text-slate-600">
            จัดการบัญชีผู้ใช้ บทบาท สถานะ และรหัสผ่าน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            ใช้งาน {activeCount} คน
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            ทั้งหมด {totalCount} คน
          </span>
          <Link
            href="/audit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            🕘 ประวัติการจัดการ
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <input type="hidden" name="page" value="1" />
        <div className="min-w-40 flex-1">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            ค้นหา
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="ชื่อ อีเมล ห้องเรียน หรือรหัสนักเรียน"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            บทบาท
          </label>
          <select
            id="role"
            name="role"
            defaultValue={role}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">ทั้งหมด</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ถูกระงับ</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900"
        >
          กรอง
        </button>
        <Link
          href="/users"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          ล้าง
        </Link>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  ผู้ใช้
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  บทบาท
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  คะแนน
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={!user.isActive ? "bg-slate-50" : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {(user.className || user.studentId) && (
                          <p className="text-xs text-slate-400">
                            {[user.studentId, user.className]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.id === currentUser.id ? (
                      <span className="text-xs text-slate-500">
                        {ROLE_LABELS[user.role]} (คุณ)
                      </span>
                    ) : (
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        currentUserRole={currentUser.role}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {user.isActive ? "ใช้งาน" : "ถูกระงับ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                          isBookingLocked(user.score)
                            ? "bg-red-50 text-red-700"
                            : user.score >= 75
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                        title={`คะแนนการใช้งาน (เกณฑ์ขั้นต่ำ ${BOOKING_SCORE_MIN_TO_BOOK})`}
                      >
                        {user.score}
                      </span>
                      {isBookingLocked(user.score) && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          ระงับการจอง
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {canManageTarget(user.id, user.role) && (
                        <ScoreActions
                          userId={user.id}
                          locked={isBookingLocked(user.score)}
                        />
                      )}

                      {canManageTarget(user.id, user.role) && (
                      <Dropdown trigger="แก้ไขข้อมูล">
                        <form
                          action={updateUserProfile}
                          className="space-y-2"
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />
                          <input
                            name="name"
                            defaultValue={user.name}
                            placeholder="ชื่อ"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="className"
                            defaultValue={user.className ?? ""}
                            placeholder="ห้องเรียน"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="studentId"
                            defaultValue={user.studentId ?? ""}
                            placeholder="รหัสนักศึกษา"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <input
                            name="phone"
                            defaultValue={user.phone ?? ""}
                            placeholder="เบอร์โทร"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            บันทึก
                          </button>
                        </form>
                      </Dropdown>
                      )}

                      {canManageTarget(user.id, user.role) && (
                      <Dropdown trigger="ตั้งรหัสใหม่">
                        <form action={resetUserPassword} className="space-y-2">
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />
                          <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={8}
                            placeholder="รหัสผ่านใหม่อย่างน้อย 8 ตัว"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            ตั้งรหัสผ่านใหม่
                          </button>
                        </form>
                      </Dropdown>
                      )}

                      {user.id !== currentUser.id && canManageTarget(user.id, user.role) && (
                        <form action={toggleUserStatus}>
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />
                          <button
                            type="submit"
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                              user.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {user.isActive ? "ระงับบัญชี" : "เปิดใช้งาน"}
                          </button>
                        </form>
                      )}

                      {user.id !== currentUser.id && canManageTarget(user.id, user.role) && (
                        <form action={deleteUser}>
                          <input
                            type="hidden"
                            name="userId"
                            value={user.id}
                          />
                          <ConfirmSubmitButton
                            title="ลบผู้ใช้?"
                            message={`ลบผู้ใช้ "${user.name}" (${user.email})? ข้อมูลการจอง อุปกรณ์ และการแจ้งเตือนของผู้ใช้นี้จะถูกลบอย่างถาวร`}
                            confirmLabel="ลบ"
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            ลบผู้ใช้
                          </ConfirmSubmitButton>
                        </form>
                      )}

                      <Link
                        href={`/users/${user.id}`}
                        className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
                      >
                        ดูการใช้งาน
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {q || role !== "ALL" || status !== "ALL"
            ? "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการกรอง"
            : "ยังไม่มีผู้ใช้ในระบบ"}
        </p>
      )}

      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          basePath="/users"
          params={{ role: role ?? "ALL", status: status ?? "ALL", q }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params: Record<string, string>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
      aria-label="แบ่งหน้า"
    >
      <p className="text-sm text-slate-600">
        หน้า {page} จาก {totalPages} ({total} รายการ)
      </p>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link
            href={href(page - 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            ← ก่อนหน้า
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={href(page + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            ถัดไป →
          </Link>
        )}
      </div>
    </nav>
  );
}
