import "server-only";

/**
 * ทำ cell ให้ปลอดภัยสำหรับ CSV
 * - ป้องกัน CSV formula injection (ขึ้นต้นด้วย = + - @ \t \r)
 * - escape เครื่องหมายคำพูด
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
