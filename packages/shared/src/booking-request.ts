export const BOOKING_REQUEST_TYPE = {
  RETURN: 'RETURN',
  EXTEND: 'EXTEND',
} as const

export type BookingRequestType =
  (typeof BOOKING_REQUEST_TYPE)[keyof typeof BOOKING_REQUEST_TYPE]

export const BOOKING_REQUEST_TYPE_LABELS: Record<BookingRequestType, string> = {
  [BOOKING_REQUEST_TYPE.RETURN]: 'ขอคืนเครื่องก่อนเวลา',
  [BOOKING_REQUEST_TYPE.EXTEND]: 'ขอขยายเวลา',
}

export const BOOKING_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type BookingRequestStatus =
  (typeof BOOKING_REQUEST_STATUS)[keyof typeof BOOKING_REQUEST_STATUS]

export const BOOKING_REQUEST_STATUS_LABELS: Record<
  BookingRequestStatus,
  string
> = {
  [BOOKING_REQUEST_STATUS.PENDING]: 'รออนุมัติ',
  [BOOKING_REQUEST_STATUS.APPROVED]: 'อนุมัติแล้ว',
  [BOOKING_REQUEST_STATUS.REJECTED]: 'ปฏิเสธ',
}
