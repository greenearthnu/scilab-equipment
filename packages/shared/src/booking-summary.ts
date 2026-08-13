/** ข้อมูลสรุปการจอง — ใช้ร่วมกันทุกช่องทางแจ้งเตือน (Telegram/อีเมล/Push) */
export interface BookingSummaryInfo {
  studentName: string
  studentScore?: number | null
  className?: string | null
  instrumentName: string
  date: Date
  startTime: string
  endTime: string
  purpose?: string | null
  /** บรรทัดแรกบอกเหตุการณ์ เช่น "ขอคืนเครื่องก่อนเวลา", "ขอขยายเวลา", "ขอจองเครื่องมือ" */
  actionNote?: string
}

/**
 * สรุปข้อมูลการจองเป็นรูปแบบเดียวสำหรับทุกข้อความแจ้งเตือน
 * (คืนเป็น plain text — ฝั่งช่องทางเป็นผู้ escape HTML เอง)
 */
export function formatBookingSummary(info: BookingSummaryInfo): string {
  const lines: string[] = []
  if (info.actionNote) lines.push(`ℹ️ ${info.actionNote}`)
  lines.push(
    `👤 ผู้ขอ: ${info.studentName}` +
      (info.className ? ` (${info.className})` : '') +
      (info.studentScore != null ? ` • คะแนน ${info.studentScore}` : '')
  )
  lines.push(`🔧 เครื่องมือ: ${info.instrumentName}`)
  lines.push(`📅 วันที่: ${info.date.toLocaleDateString('th-TH')}`)
  lines.push(`⏰ เวลา: ${info.startTime}–${info.endTime} น.`)
  if (info.purpose) lines.push(`📝 วัตถุประสงค์: ${info.purpose}`)
  return lines.join('\n')
}

/**
 * สรุปแบบสั้น — 1–2 บรรทัด ใจความสำคัญ (ผู้ขอ/เครื่องมือ/วัน-เวลา/คะแนน)
 * ใช้เมื่อผู้ใช้เลือก "สรุปสั้น" ในการตั้งค่าการแจ้งเตือน Telegram
 */
export function formatBookingSummaryShort(info: BookingSummaryInfo): string {
  const lines: string[] = []
  if (info.actionNote) lines.push(`ℹ️ ${info.actionNote}`)
  lines.push(
    `👤 ${info.studentName}` +
      (info.className ? ` (${info.className})` : '') +
      ` • 🔧 ${info.instrumentName}` +
      ` • 📅 ${info.date.toLocaleDateString('th-TH')}` +
      ` • ⏰ ${info.startTime}–${info.endTime} น.` +
      (info.studentScore != null ? ` • คะแนน ${info.studentScore}` : '')
  )
  if (info.purpose) lines.push(`📝 ${info.purpose}`)
  return lines.join('\n')
}
