export * from './roles'
export * from './email'
export * from './score'
export * from './booking'
export * from './time-slots'
export * from './booking-request'
export * from './reminder'
export * from './awards'
export * from './booking-summary'

export function formatDateThai(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
