export interface TimeRange {
  startTime: string
  endTime: string
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isValidTimeRange(range: TimeRange): boolean {
  return isValidTime(range.startTime) && isValidTime(range.endTime) && range.startTime < range.endTime
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

export function formatTimeRange(range: TimeRange): string {
  return `${range.startTime}-${range.endTime} น.`
}

export function formatTimeRanges(ranges: TimeRange[]): string {
  if (ranges.length === 0) return ""
  if (ranges.length === 1) return formatTimeRange(ranges[0])
  return ranges.map((r) => formatTimeRange(r)).join(", ")
}
