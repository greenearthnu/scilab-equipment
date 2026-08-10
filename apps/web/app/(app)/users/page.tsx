import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@scilab/db";
import { ROLES, ROLE_LABELS } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import {
  toggleUserStatus,
  resetUserPassword,
  updateUserProfile,
} from "@/lib/actions/users";
import { RoleSelector } from "@/components/users/role-selector";
import Dropdown from "@/components/dropdown";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== ROLES.LAB_ADMIN) {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้</h1>
        <p className="mt-1 text-slate-600">
          จัดการบัญชีผู้ใช้ บทบาท สถานะ และรหัสผ่าน
        </p>
      </div>

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
                      <RoleSelector userId={user.id} currentRole={user.role} />
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
                    <div className="flex flex-wrap items-center gap-2">
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

                      {user.id !== currentUser.id && (
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
          ยังไม่มีผู้ใช้ในระบบ
        </p>
      )}
    </div>
  );
}
