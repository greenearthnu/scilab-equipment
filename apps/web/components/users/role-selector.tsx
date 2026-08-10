"use client";

import { ROLE_LABELS, ROLES, type Role } from "@scilab/shared";
import { updateUserRole } from "@/lib/actions/users";

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).filter(
  (r) => r !== ROLES.LAB_ADMIN
);

export function RoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  if (currentRole === ROLES.LAB_ADMIN) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        {ROLE_LABELS[ROLES.LAB_ADMIN]}
      </span>
    );
  }

  return (
    <form action={updateUserRole}>
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
      >
        {ROLE_OPTIONS.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </form>
  );
}
