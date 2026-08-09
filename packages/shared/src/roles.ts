export const ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  LAB_ADMIN: 'LAB_ADMIN',
  EXECUTIVE: 'EXECUTIVE',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.STUDENT]: 'นักเรียน',
  [ROLES.TEACHER]: 'ครู',
  [ROLES.LAB_ADMIN]: 'ผู้ดูแลห้องแล็บ',
  [ROLES.EXECUTIVE]: 'ผู้บริหาร',
}

export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' &&
    Object.values(ROLES).includes(value as Role)
  )
}
