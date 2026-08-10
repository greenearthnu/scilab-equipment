export interface TimeSlot {
  id: string
  label: string
  start: string
  end: string
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: 'P1', label: 'คาบ 1', start: '08:00', end: '08:50' },
  { id: 'P2', label: 'คาบ 2', start: '08:50', end: '09:40' },
  { id: 'P3', label: 'คาบ 3', start: '09:50', end: '10:40' },
  { id: 'P4', label: 'คาบ 4', start: '10:40', end: '11:30' },
  { id: 'P5', label: 'คาบ 5', start: '11:30', end: '12:20' },
  { id: 'P6', label: 'คาบ 6', start: '12:30', end: '13:20' },
  { id: 'P7', label: 'คาบ 7', start: '13:20', end: '14:10' },
  { id: 'P8', label: 'คาบ 8', start: '14:20', end: '15:10' },
  { id: 'P9', label: 'คาบ 9', start: '15:10', end: '16:00' },
  { id: 'P10', label: 'คาบ 10', start: '16:00', end: '16:50' },
] as const

const TIME_SLOT_IDS = TIME_SLOTS.map((s) => s.id)

export function isValidTimeSlot(value: string): boolean {
  return TIME_SLOT_IDS.includes(value)
}

export function getTimeSlot(id: string): TimeSlot | undefined {
  return TIME_SLOTS.find((s) => s.id === id)
}

export function formatTimeSlot(id: string): string {
  const slot = getTimeSlot(id)
  return slot ? `${slot.label} (${slot.start}-${slot.end})` : id
}

export function formatTimeSlots(ids: string[]): string {
  if (ids.length === 0) return ""
  if (ids.length === 1) return formatTimeSlot(ids[0])
  return ids.map((id) => getTimeSlot(id)?.label ?? id).join(", ")
}

export function sortTimeSlots(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const ia = TIME_SLOT_IDS.indexOf(a)
    const ib = TIME_SLOT_IDS.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}
