
# 🔬 SciLab Booking

ระบบจองเครื่องมือและอุปกรณ์ในห้องปฏิบัติการวิทยาศาสตร์สำหรับโรงเรียนมัธยม
รองรับการใช้งานทั้ง **Web** และ **Mobile** ผ่าน API เดียวกัน

## ความสามารถหลัก

- 📅 **จองช่วงเวลาอิสระ** — เลือกวัน + เวลาเริ่ม-สิ้นสุด ได้อย่างอิสระ (ทั้ง web และ mobile) + หน้า web โชว์ช่วงเวลาที่ถูกจองแล้วแบบ real-time
- ⏱️ **QR เช็คอิน/เช็คเอาท์** — web แสดง QR, mobile สแกน, สถานะอัตโนมัติ
- 🔔 **Push Notification** — แจ้งเตือนเมื่ออนุมัติ/ปฏิเสธ/เช็คอิน/เช็คเอาท์
- 📧 **Email แจ้งเตือน** — SMTP ส่งอีเมลเมื่อมีคำขอจองใหม่/อนุมัติ/ปฏิเสธ/เช็คอิน/เช็คเอาท์
- 📷 **รูปหลักฐานหลังใช้งาน** — ผู้จองอัปโหลดรูปหลังเช็คเอาท์/เสร็จสิ้น (web + mobile)
- 🖼️ **รูปเครื่องมือ** — อัปโหลดรูปประกอบอุปกรณ์ตอนเพิ่มเครื่องมือ
- 👥 **จัดการผู้ใช้** — LAB_ADMIN เปลี่ยนบทบาท, ระงับ/เปิดบัญชี, ตั้งรหัสผ่านใหม่
- 📊 **แดชบอร์ด/รายงาน** — สถิติการใช้งาน, กราฟ (สถานะ/แนวโน้ม/เครื่องมือยอดนิยม/ชั่วโมงเริ่มใช้งาน), export CSV
- 👤 **โปรไฟล์ผู้ใช้** — รูปโปรไฟล์ + รหัสนักเรียน/เบอร์โทร/ห้องเรียน

## บทบาทผู้ใช้ (Roles)

| บทบาท | สิทธิ์หลัก |
|---|---|
| นักเรียน (STUDENT) | ดูเครื่องมือ, จองช่วงเวลาอิสระ, อัปโหลดรูปหลักฐานหลังใช้, ยกเลิกการจองของตัวเอง |
| ครู (TEACHER) | ดู/จองเอง, อนุมัติ/ปฏิเสธคำขอจอง |
| ผู้ดูแลห้องแล็บ (LAB_ADMIN) | เพิ่ม/แก้ไขเครื่องมือ + รูปอุปกรณ์, กำหนดสถานะ, อนุมัติ, เช็คอิน/เช็คเอาท์, จัดการผู้ใช้ (บทบาท/สถานะ/รหัสผ่าน), ดูรูปหลักฐาน |
| ผู้บริหาร (EXECUTIVE) | ดูแดชบอร์ดและสถิติ (อ่านอย่างเดียว) |

## โครงสร้างโปรเจกต์

```
.
├── apps/
│   ├── web/          # Next.js 16 (App Router) + Tailwind CSS
│   └── mobile/       # React Native + Expo Router
├── packages/
│   ├── db/           # Prisma schema + client + seed
│   └── shared/       # Types/constants ร่วม (roles, status, ช่วงเวลา)
└── pnpm-workspace.yaml
```

## เทคโนโลยี

- **Web:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Mobile:** Expo SDK 57 (React Native), expo-router, expo-secure-store
- **Database:** Prisma ORM (SQLite สำหรับพัฒนา / PostgreSQL เช่น Supabase สำหรับผลิตจริง)
- **Auth:** Session JWT (jose) ฝั่ง web, Bearer token ฝั่ง mobile

## เริ่มต้นใช้งาน

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. สร้าง database + seed ข้อมูลตัวอย่าง
pnpm db:migrate     # สร้างตาราง
pnpm db:seed        # ข้อมูลตัวอย่าง

# 3. ตั้งค่า environment (ครั้งแรก)
cp apps/web/.env.example apps/web/.env
# แล้วแก้ SESSION_SECRET (openssl rand -base64 32)

# 4. รัน web
pnpm dev:web        # http://localhost:3000

# 5. รัน mobile (อีก terminal)
pnpm dev:mobile
# เซ็ต API URL ของ web: EXPO_PUBLIC_API_URL=http://<IP-เครื่อง>:3000
# เช่นใน .env ของ apps/mobile หรือ: EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 pnpm dev:mobile
```

> หมายเหตุ: ในแต่ละครั้งที่แก้ `packages/db/prisma/schema.prisma` ให้รัน `pnpm db:generate` ก่อน

## บัญชีตัวอย่าง (รหัสผ่านทั้งหมด: `Password123!`)

| อีเมล | บทบาท |
|---|---|
| admin@school.ac.th | ผู้ดูแลห้องแล็บ |
| teacher@school.ac.th | ครู |
| executive@school.ac.th | ผู้บริหาร |
| student@school.ac.th | นักเรียน |

## Environment Variables

| ตัวแปร | ที่ | คำอธิบาย |
|---|---|---|
| `DATABASE_URL` | `packages/db/.env`, `apps/web/.env` | connection string ของฐานข้อมูล (SQLite เริ่มต้น) |
| `SESSION_SECRET` | `apps/web/.env` | ใช้เซ็น JWT session |
| `EXPO_PUBLIC_API_URL` | `apps/mobile/.env` | URL ของ backend web ที่ mobile เรียก |
| `EXPO_ACCESS_TOKEN` | `apps/web/.env` | (ไม่บังคับ) Expo access token สำหรับ push production |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `apps/web/.env` | (ไม่บังคับ) SMTP server สำหรับส่งอีเมลแจ้งเตือน |
| `SMTP_USER` / `SMTP_PASS` | `apps/web/.env` | (ไม่บังคับ) บัญชี SMTP สำหรับ authenticate |
| `EMAIL_FROM` | `apps/web/.env` | (ไม่บังคับ) ชื่อ/อีเมลผู้ส่ง (ค่าเริ่มต้น: `SciLab Booking <no-reply@school.ac.th>`) |

## Scripts หลัก

```bash
pnpm dev:web         # รัน web
pnpm dev:mobile      # รัน mobile (expo)
pnpm db:migrate      # migrate database
pnpm db:seed         # ใส่ข้อมูลตัวอย่าง
pnpm db:generate     # generate Prisma client หลังแก้ schema
pnpm build           # build web
pnpm typecheck       # ตรวจ type ทั้งโปรเจกต์
pnpm lint            # lint ทั้งโปรเจกต์
```

## ใช้งานจริง (Production)

- เปลี่ยน `packages/db/prisma/schema.prisma` → `provider = "postgresql"` และตั้ง `DATABASE_URL` เป็น Supabase/Postgres
- Web: deploy บน Vercel (ตั้ง env ทั้งหมด)
- Mobile: `eas build` เพื่อสร้าง APK/IPA ผ่าน EAS

## Roadmap

- [x] M1 Auth + Roles + DB schema
- [x] M2 CRUD เครื่องมือ + ระบบจอง + เช็คความขัดแย้ง
- [x] M3 ระบบอนุมัติ + แจ้งเตือนในแอป
- [x] M4 Mobile App พื้นฐาน (ดู/จองเครื่องมือ)
- [x] M5 Push Notification (Expo Notifications) — แจ้งเตือนเมื่ออนุมัติ/ปฏิเสธ/เช็คอิน/เช็คเอาท์
- [x] M6 แดชบอร์ดสถิติผู้บริหาร (กราฟ + export รายงาน CSV)
- [x] M7 QR Code เช็คอิน/เช็คเอาท์ (web แสดง QR, mobile สแกน)
- [x] M8 โปรไฟล์ผู้ใช้ (รูปโปรไฟล์อัปโหลด + ข้อมูลส่วนตัว: รหัสนักเรียน, เบอร์โทร, ห้องเรียน)
- [x] M9 จองช่วงเวลาอิสระ (Booking มี startTime/endTime, เลือกวัน + เวลาเริ่ม-สิ้นสุด แบบอิสระ ไม่จำกัดเฉพาะคาบเรียน)
- [x] M10 รูปหลักฐานหลังใช้งาน (ผู้จองอัปโหลด, แอดมินดูได้ — ทั้ง web และ mobile)
- [x] M11 รูปเครื่องมืออุปกรณ์ (อัปโหลดตอนเพิ่มเครื่องมือ + แสดงผลทั้ง web/mobile)
- [x] M12 จัดการผู้ใช้สำหรับ LAB_ADMIN (เปลี่ยนบทบาท, ระงับ/เปิดบัญชี, ตั้งรหัสผ่านใหม่)
- [x] M13 Email แจ้งเตือน (SMTP) — จองใหม่/อนุมัติ/ปฏิเสธ/เช็คอิน/เช็คเอาท์
- [x] M14 สถิติกราฟบนแดชบอร์ด (สถานะการจอง, แนวโน้ม 14 วัน, เครื่องมือยอดนิยม, ชั่วโมงเริ่มใช้งาน) — แสดงสำหรับครู/แอดมิน/ผู้บริหาร
- [x] M15 UX ปรับปรุง — หน้า booking โชว์ช่วงเวลาที่ถูกจองแล้วแบบ real-time + เลือกช่วงเวลาจากตาราง timeline (web & mobile), confirm dialog ก่อนยกเลิก/ปฏิเสธ/เช็คเอาท์
