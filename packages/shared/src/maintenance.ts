export const MAINTENANCE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type MaintenanceStatus =
  (typeof MAINTENANCE_STATUS)[keyof typeof MAINTENANCE_STATUS]

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MAINTENANCE_STATUS.SCHEDULED]: 'รอซ่อม',
  [MAINTENANCE_STATUS.IN_PROGRESS]: 'กำลังซ่อม',
  [MAINTENANCE_STATUS.COMPLETED]: 'ซ่อมเสร็จ',
  [MAINTENANCE_STATUS.CANCELLED]: 'ยกเลิก',
}

/** สถานะที่ถือว่าช่วงเวลานั้นยังไม่สามารถจองได้ */
export const MAINTENANCE_ACTIVE_STATUSES = [
  MAINTENANCE_STATUS.SCHEDULED,
  MAINTENANCE_STATUS.IN_PROGRESS,
] as const
