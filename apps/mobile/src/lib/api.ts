import type { Role, BookingStatus, InstrumentStatus, InstrumentCategory } from '@scilab/shared'

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  className: string | null
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
  timeSlot: string
  purpose: string | null
  status: BookingStatus
  instrument: {
    id: string
    name: string
    category: InstrumentCategory
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
  data: { instrumentId: string; date: string; timeSlot: string; purpose?: string }
) {
  return request<{ booking: Booking }>('/api/bookings', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
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
