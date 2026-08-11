export * from './roles'
export * from './booking'
export * from './time-slots'
export * from './booking-request'
export * from './reminder'

export function formatDateThai(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
