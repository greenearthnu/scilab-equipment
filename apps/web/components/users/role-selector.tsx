"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ROLE_LABELS,
  ROLES,
  canManageAdminRoles,
  type Role,
} from "@scilab/shared";
import { updateUserRole } from "@/lib/actions/users";

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

/** LAB_ADMIN มอบได้เฉพาะบทบาทระดับต่ำ (ไม่รวม OWNER/LAB_ADMIN) */
const ADMIN_GRANTABLE = ALL_ROLES.filter(
  (r) => r !== ROLES.LAB_ADMIN && r !== ROLES.OWNER
);

export function RoleSelector({
  userId,
  currentRole,
  currentUserRole,
}: {
  userId: string;
  currentRole: Role;
  currentUserRole: Role;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // ค่าใน select ใช้ state ในเครื่อง (optimistic) เพื่อให้ UI อัปเดตทันที
  const [value, setValue] = useState<Role>(currentRole);
  const [prevRole, setPrevRole] = useState<Role>(currentRole);

  // ซิงก์กับค่าจาก server เมื่อ revalidate/refresh ส่งค่าใหม่มา (adjust state during render)
  if (prevRole !== currentRole) {
    setPrevRole(currentRole);
    setValue(currentRole);
  }

  const canGrant =
    canManageAdminRoles(currentUserRole) ||
    (currentRole !== ROLES.OWNER && currentRole !== ROLES.LAB_ADMIN);

  if (!canGrant) {
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          currentRole === ROLES.OWNER
            ? "bg-violet-50 text-violet-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {ROLE_LABELS[currentRole]}
      </span>
    );
  }

  const options = canManageAdminRoles(currentUserRole)
    ? ALL_ROLES
    : ADMIN_GRANTABLE;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Role;
    setValue(next); // แสดงค่าที่เลือกทันที
    const form = e.currentTarget.form;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await updateUserRole(formData);
      } catch {
        // การเปลี่ยนบทบาทไม่สำเร็จ (เช่น ห้ามลดสิทธิ์ OWNER คนสุดท้าย) — คืนค่าเดิม
        setValue(currentRole);
      } finally {
        router.refresh(); // ดึงข้อมูลล่าสุดจาก server เพื่อซิงก์ค่าใน UI
      }
    });
  };

  return (
    <form>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        value={value}
        disabled={isPending}
        onChange={handleChange}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-60"
      >
        {options.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </form>
  );
}
