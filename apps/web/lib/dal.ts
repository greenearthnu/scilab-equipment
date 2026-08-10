import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Role } from '@scilab/shared'
import { db } from '@scilab/db'
import { decrypt } from '@/lib/session'

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return session
})

export const getCurrentUser = cache(async () => {
  const session = await verifySession()

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      className: true,
      studentId: true,
      phone: true,
      avatarUrl: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return user
})

export function requireRole(userRole: Role, roles: Role[]): boolean {
  return roles.includes(userRole)
}

export function redirectIfNotAllowed(userRole: Role, roles: Role[]) {
  if (!requireRole(userRole, roles)) {
    redirect('/dashboard')
  }
}
