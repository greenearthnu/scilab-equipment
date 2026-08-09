'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@scilab/db'
import { ROLES } from '@scilab/shared'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง').trim(),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

const RegisterSchema = z.object({
  name: z.string().min(2, 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร').trim(),
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง').trim(),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[a-zA-Z]/, 'รหัสผ่านต้องมีตัวอักษร')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลข')
    .trim(),
  className: z.string().trim().optional(),
})

export type AuthFormState =
  | {
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export async function login(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    return { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  await createSession(user.id, user.role)
  redirect('/dashboard')
}

export async function register(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    className: formData.get('className'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, email, password, className } = validated.data

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existing) {
    return { errors: { email: ['อีเมลนี้ถูกใช้งานแล้ว'] } }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: ROLES.STUDENT,
      className,
    },
  })

  await createSession(user.id, user.role)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
