export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  CHECKED_OUT: 'CHECKED_OUT',
  COMPLETED: 'COMPLETED',
} as const

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS]

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BOOKING_STATUS.PENDING]: 'รออนุมัติ',
  [BOOKING_STATUS.APPROVED]: 'อนุมัติแล้ว',
  [BOOKING_STATUS.REJECTED]: 'ปฏิเสธ',
  [BOOKING_STATUS.CANCELLED]: 'ยกเลิก',
  [BOOKING_STATUS.CHECKED_OUT]: 'เช็คเอาท์',
  [BOOKING_STATUS.COMPLETED]: 'เสร็จสิ้น',
}

export const INSTRUMENT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  DISABLED: 'DISABLED',
} as const

export type InstrumentStatus =
  (typeof INSTRUMENT_STATUS)[keyof typeof INSTRUMENT_STATUS]

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentStatus, string> = {
  [INSTRUMENT_STATUS.AVAILABLE]: 'พร้อมใช้งาน',
  [INSTRUMENT_STATUS.MAINTENANCE]: 'ซ่อมบำรุง',
  [INSTRUMENT_STATUS.DISABLED]: 'ยกเลิกใช้งาน',
}

export const INSTRUMENT_CATEGORY = {
  MICROSCOPE: 'MICROSCOPE',
  MEASURING: 'MEASURING',
  CHEMICAL: 'CHEMICAL',
  GLASSWARE: 'GLASSWARE',
  ELECTRICAL: 'ELECTRICAL',
  OTHER: 'OTHER',
} as const

export type InstrumentCategory =
  (typeof INSTRUMENT_CATEGORY)[keyof typeof INSTRUMENT_CATEGORY]

export const INSTRUMENT_CATEGORY_LABELS: Record<
  InstrumentCategory,
  string
> = {
  [INSTRUMENT_CATEGORY.MICROSCOPE]: 'กล้องจุลทรรศน์',
  [INSTRUMENT_CATEGORY.MEASURING]: 'เครื่องมือวัด',
  [INSTRUMENT_CATEGORY.CHEMICAL]: 'สารเคมี',
  [INSTRUMENT_CATEGORY.GLASSWARE]: 'อุปกรณ์แก้ว',
  [INSTRUMENT_CATEGORY.ELECTRICAL]: 'อุปกรณ์ไฟฟ้า',
  [INSTRUMENT_CATEGORY.OTHER]: 'อื่นๆ',
}
