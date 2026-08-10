# SciLab Booking — Web

Web frontend ของระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์
ใช้ **Next.js 16 (App Router)** + **Tailwind CSS** + **TypeScript**

รันโดยตรงหรือผ่าน workspace root ได้ทั้งคู่ (ดู [README หลัก](../../README.md) สำหรับภาพรวมทั้งโปรเจกต์)

## เริ่มต้น

```bash
# ตั้งค่า environment (ครั้งแรก)
cp .env.example .env
# แก้ SESSION_SECRET (openssl rand -base64 32)

# รัน dev server
pnpm dev    # http://localhost:3000
```

## Scripts

| คำสั่ง | ความหมาย |
|---|---|
| `pnpm dev` | รัน dev server |
| `pnpm build` | build สำหรับ production |
| `pnpm typecheck` | ตรวจ type (tsc --noEmit) |
| `pnpm lint` | lint (eslint) |

## โครงสร้างหลัก

```
app/(app)/            # หน้าในระบบหลัง login (dashboard, bookings, instruments, reports, users, profile)
app/api/              # REST API ที่ mobile ใช้ (auth, bookings, instruments, devices, reports/export)
components/           # Client components (booking-form, time-range-picker, charts, ...)
lib/                  # Server utilities (actions, email, push, session, dal, stats, booking-conflict)
```

## จุดสำคัญ

- **Auth:** Web ใช้ session cookie (`httpOnly`), mobile ใช้ Bearer token — `getApiUser()` รองรับทั้งสองแบบ
- **การจอง:** เลือกช่วงเวลาจากตาราง timeline (`time-range-picker.tsx`) → ตรวจความทับซ้อนทั้งฝั่ง client และ server (`lib/booking-conflict.ts`)
- **รูป:** อัปโหลดไฟล์ผ่าน Server Action ไปที่ `public/uploads/` (bodySizeLimit ตั้งไว้ที่ 8mb ใน `next.config.ts`)
- **Email/Push:** ส่งเมื่อจองใหม่/อนุมัติ/ปฏิเสธ/เช็คอิน/เช็คเอาท์ (ตั้ง SMTP ได้ใน `.env`)

## Environment Variables

| ตัวแปร | คำอธิบาย |
|---|---|
| `DATABASE_URL` | connection string ฐานข้อมูล |
| `SESSION_SECRET` | ใช้เซ็น JWT session |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | (ไม่บังคับ) SMTP server |
| `SMTP_USER` / `SMTP_PASS` | (ไม่บังคับ) บัญชี SMTP |
| `EMAIL_FROM` | (ไม่บังคับ) ผู้ส่งอีเมล |
