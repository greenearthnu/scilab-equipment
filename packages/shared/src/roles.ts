export const ROLES = {
  OWNER: 'OWNER',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  LAB_ADMIN: 'LAB_ADMIN',
  EXECUTIVE: 'EXECUTIVE',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.OWNER]: 'ผู้ดูแลระบบ',
  [ROLES.STUDENT]: 'นักเรียน',
  [ROLES.TEACHER]: 'ครู',
  [ROLES.LAB_ADMIN]: 'ผู้ดูแลห้องแล็บ',
  [ROLES.EXECUTIVE]: 'ผู้บริหาร',
}

/** บทบาทระดับผู้ดูแลที่จัดการระบบได้ */
export const ADMIN_ROLES = [ROLES.OWNER, ROLES.LAB_ADMIN] as const

/** บทบาทที่มอบสิทธิ์ได้เฉพาะเจ้าของระบบ (OWNER) */
export const MANAGED_ROLES = [ROLES.OWNER, ROLES.LAB_ADMIN] as const

export function isAdminRole(role: Role): boolean {
  return role === ROLES.OWNER || role === ROLES.LAB_ADMIN
}

/** เฉพาะ OWNER ที่สามารถมอบ/ถอนสิทธิ์ OWNER และ LAB_ADMIN ได้ */
export function canManageAdminRoles(role: Role): boolean {
  return role === ROLES.OWNER
}

export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' &&
    Object.values(ROLES).includes(value as Role)
  )
}
