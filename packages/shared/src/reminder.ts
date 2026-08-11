export interface ReminderOption {
  value: number
  label: string
}

export const REMINDER_OPTIONS: ReminderOption[] = [
  { value: 0, label: 'ไม่ต้องแจ้งเตือน' },
  { value: 15, label: '15 นาทีก่อนเริ่ม' },
  { value: 30, label: '30 นาทีก่อนเริ่ม' },
  { value: 60, label: '1 ชั่วโมงก่อนเริ่ม' },
  { value: 120, label: '2 ชั่วโมงก่อนเริ่ม' },
]

export function reminderLabel(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return 'ไม่ต้องแจ้งเตือน'
  const option = REMINDER_OPTIONS.find((o) => o.value === minutes)
  if (option) return option.label
  if (minutes % 60 === 0) return `${minutes / 60} ชั่วโมงก่อนเริ่ม`
  return `${minutes} นาทีก่อนเริ่ม`
}
