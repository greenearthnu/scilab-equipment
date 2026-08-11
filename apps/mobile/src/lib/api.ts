import type { Role, BookingStatus, InstrumentStatus, InstrumentCategory } from '@scilab/shared'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_URL}${path}`
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  className: string | null
  studentId: string | null
  phone: string | null
  avatarUrl: string | null
}

export interface Instrument {
  id: string
  name: string
  category: InstrumentCategory
  description: string | null
  imageUrl: string | null
  totalQuantity: number
  availableCount: number
  status: InstrumentStatus
  location: string | null
}

export interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  purpose: string | null
  status: BookingStatus
  evidenceUrl: string | null
  instrument: {
    id: string
    name: string
    category: InstrumentCategory
  }
}

export interface BookingRequest {
  id: string
  type: 'RETURN' | 'EXTEND'
  reason: string | null
  newEndTime: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  requestedBy: {
    id: string
    name: string
    className: string | null
  }
  booking: {
    id: string
    date: string
    startTime: string
    endTime: string
    status: BookingStatus
    instrument: {
      id: string
      name: string
    }
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message)
  }

  return (await res.json()) as T
}

export function loginApi(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getInstruments(token: string) {
  return request<{ instruments: Instrument[] }>('/api/instruments', token)
}

export function getBookings(token: string) {
  return request<{ bookings: Booking[] }>('/api/bookings', token)
}

export function createBookingApi(
  token: string,
  data: {
    instrumentId: string
    date: string
    startTime: string
    endTime: string
    purpose?: string
    reminderOffsetMinutes?: number
  }
) {
  return request<{ booking: Booking }>('/api/bookings', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getAvailability(
  token: string,
  instrumentId: string,
  date: string
) {
  return request<{ takenRanges: { startTime: string; endTime: string }[] }>(
    `/api/bookings/availability?instrumentId=${encodeURIComponent(
      instrumentId
    )}&date=${encodeURIComponent(date)}`,
    token
  )
}

export function registerDevice(
  token: string,
  data: { pushToken: string; platform: string }
) {
  return request<{ success: boolean }>('/api/devices', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function checkinBooking(token: string, bookingId: string) {
  return request<{ success: boolean }>(
    `/api/bookings/${bookingId}/checkin`,
    token,
    { method: 'POST' }
  )
}

export function checkoutBooking(token: string, bookingId: string) {
  return request<{ success: boolean }>(
    `/api/bookings/${bookingId}/checkout`,
    token,
    { method: 'POST' }
  )
}

export function requestReturn(
  token: string,
  bookingId: string,
  reason?: string
) {
  return request<{ success: boolean }>(
    `/api/bookings/${bookingId}/request-return`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    }
  )
}

export function requestExtend(
  token: string,
  bookingId: string,
  newEndTime: string,
  reason?: string
) {
  return request<{ success: boolean }>(
    `/api/bookings/${bookingId}/request-extend`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        newEndTime,
        ...(reason ? { reason } : {}),
      }),
    }
  )
}

export function getBookingRequests(token: string) {
  return request<{ requests: BookingRequest[] }>('/api/booking-requests', token)
}

export function decideBookingRequest(
  token: string,
  requestId: string,
  approve: boolean
) {
  return request<{ success: boolean }>(
    `/api/booking-requests/${requestId}/decide`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ approve }),
    }
  )
}

export async function uploadEvidence(
  token: string,
  bookingId: string,
  formData: FormData
): Promise<{ evidenceUrl: string }> {
  const res = await fetch(`${API_URL}/api/bookings/${bookingId}/evidence`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    let message = 'อัปโหลดรูปไม่สำเร็จ'
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message)
  }

  return (await res.json()) as { evidenceUrl: string }
}
