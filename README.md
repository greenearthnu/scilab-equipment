
# 🔬 SciLab Booking

ระบบจองเครื่องมือและอุปกรณ์ในห้องปฏิบัติการวิทยาศาสตร์สำหรับโรงเรียนมัธยม
รองรับการใช้งานทั้ง **Web** และ **Mobile** ผ่าน API เดียวกัน

## ความสามารถหลัก

- 📅 **จองช่วงเวลาอิสระ** — เลือกวัน + เวลาเริ่ม-สิ้นสุดจากตาราง timeline (บล็อก 30 นาที 07:00–19:00) ทั้ง web และ mobile, โชว์ช่วงที่ถูกจองแล้วแบบ real-time พร้อมเช็คความทับซ้อน
- 🔔 **Push Notification** — แจ้งเตือนเมื่ออนุมัติ/ปฏิเสธคำขอจอง/คำขอคืน/ขยายเวลา (ข้อความแจ้งผู้ดูแลมีคะแนนการใช้งานของผู้ขอด้วย)
- 🤖 **Telegram Bot แจ้งผู้ดูแล** — (ไม่บังคับ, ฟรี 100%) ส่งข้อความไปยังกลุ่มผู้ดูแลเมื่อมีคำขอจองใหม่/คำขอคืน-ขยายเวลา (web + mobile) พร้อมปุ่ม **อนุมัติ/ปฏิเสธกดได้จากแชทเลย** (admin ผูก Telegram User ID ผ่านหน้าโปรไฟล์) — ตั้ง `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- 🔕 **ศูนย์การแจ้งเตือนในแอป** — หน้า `/notifications` รวมการแจ้งเตือนทั้งหมด อ่าน/ยังไม่อ่าน + ปุ่ม “อ่านทั้งหมด” + กระดิ่งพร้อม badge ใน navbar
- 📧 **Email แจ้งเตือน** — SMTP ส่งอีเมลเมื่อมีคำขอจองใหม่/อนุมัติ/ปฏิเสธคำขอจอง/คำขอคืน/ขยายเวลา (อีเมลแจ้งผู้ดูแลแสดงคะแนนผู้ขอ)
- 📷 **รูปหลักฐานหลังใช้งาน** — ผู้จองอัปโหลดรูปหลังการจองเสร็จสิ้น (สถานะ COMPLETED, web + mobile)
- 🖼️ **รูปเครื่องมือ** — อัปโหลดรูปประกอบอุปกรณ์ตอนเพิ่มเครื่องมือ
- 👥 **จัดการผู้ใช้** — OWNER/LAB_ADMIN เปลี่ยนบทบาท, ระงับ/เปิดบัญชี, ตั้งรหัสผ่านใหม่, ลบผู้ใช้ (มอบสิทธิ์ OWNER/LAB_ADMIN ได้เฉพาะ OWNER)
- 📊 **แดชบอร์ด/รายงาน** — สถิติการใช้งาน, กราฟ (สถานะ/แนวโน้ม/เครื่องมือยอดนิยม/ชั่วโมงเริ่มใช้งาน), export CSV, **กรองช่วงวันที่ (from/to)** ส่งผลทุกกราฟ + ปุ่ม **พิมพ์รายงาน (PDF)** ผ่าน browser print
- 👤 **โปรไฟล์ผู้ใช้** — รูปโปรไฟล์ + รหัสนักเรียน/เบอร์โทร/ห้องเรียน
- ⏰ **แจ้งเตือนล่วงหน้าก่อนเริ่มจอง** — ผู้จองเลือกได้ว่าจะแจ้งเตือนก่อนเริ่มใช้กี่นาที (15/30/60/120 นาที), ระบบส่ง Push + Email อัตโนมัติ (cron หรือในตัว scheduler)
- 📆 **มุมมองปฏิทิน** — ดูการจองรายเดือน, กรองตามเครื่องมือ/สถานะ, แตะวันเพื่อดูรายละเอียด (web + mobile)
- 🔄 **ขอคืน/ขยายเวลาการจอง** — ผู้จองส่งคำขอคืนก่อนเวลา / ขยายเวลาจากการจองที่อนุมัติแล้ว (APPROVED) → เฉพาะผู้ดูแลห้องแล็บ (LAB_ADMIN) อนุมัติ/ปฏิเสธ, สถานะและเวลาอัปเดตอัตโนมัติ
- 🕘 **ประวัติการจองส่วนตัว** — กรอง/ค้นหาและดูสรุปการจอง (web + mobile), export CSV (web)
- 🌸 **หน้าแรกแสดงโครงงานดีเด่น** — Homepage เปิดสาธารณะสดใสพร้อม Image Slider เน้นโครงงานดาวเด่น, จัดเรียงโครงงานเป็นรายปี, แอดมินจัดการ (เพิ่ม/เน้น/ซ่อน/ลบ/ระบุปี) ได้ผ่านหน้า `/projects`
- 📊 **ดูการใช้งานรายบุคคล** — แอดมิน/ครูเข้า `ผู้ใช้ → ดูการใช้งาน` เพื่อดูสถิติรายบุคคล (จำนวนการจอง, ชั่วโมงที่จอง, เวลาใช้จริง, เครื่องมือยอดนิยม, แนวโน้ม 6 เดือน, ประวัติการจอง)
- 📱 **UI responsive ทุกขนาดหน้าจอ** — navbar ย่อ/ขยายตาม breakpoint (แถวลิงก์บน ≥768px, **เมนูแฮมเบอร์เกอร์** บนมือถือ, ซ่อนชื่อผู้ใช้บนจอเล็ก), ตาราง/ปฏิทิน/กราฟเลื่อนภายในหรือปรับขนาดอัตโนมัติ, **รายการยาวแบ่งหน้า (pagination 20/หน้า)** — ไม่มี horizontal overflow ทุกหน้า
- ⭐ **คะแนนการใช้งาน** — ผู้ใช้มีคะแนนเริ่มต้น 100: ได้ +5 เมื่อคืนเครื่องก่อนเวลา/ตรงเวลา (อนุมัติคำขอคืน) และ +5 เมื่ออัปโหลดรูปหลักฐานหลังใช้ (จัดเก็บ/ล้างอุปกรณ์แล้ว); แอดมินเพิ่ม/หักคะแนนพร้อมเหตุผลได้ ถ้าคะแนนต่ำกว่า **50** จะถูกระงับการจองชั่วคราว (ทั้งเว็บและมือถือ) — ต้องให้ LAB_ADMIN/OWNER ปลดล็อกเท่านั้น (คะแนนกลับเป็น 100); คะแนนแสดงเป็น badge (เขียว ≥75 / เหลือง 50–74 / แดง <50 + ป้าย “ระงับการจอง”) ในทุกจุดที่เห็นข้อมูลผู้ใช้: หน้า `/users` + `/users/[id]`, รายการจอง/คำขอคืน-ขยายเวลาในหน้า `/bookings`, รายการ “การจองที่อนุมัติแล้ว” ในแดชบอร์ด, ปฏิทินการจอง (web + mobile); **ทุกการปรับคะแนนบันทึกประวัติถาวร** (ใคร/เมื่อไหร่/เหตุผล/±เท่าไร) แสดงในหน้า `/users/[id]`
- 🕘 **ประวัติการจัดการ (Audit log)** — หน้า `/audit` บันทึกการกระทำสำคัญของผู้ดูแล (เปลี่ยนบทบาท, ระงับ/เปิดบัญชี, ตั้งรหัสผ่าน, ลบผู้ใช้, ปรับคะแนน, ปลดล็อก, ซ่อมบำรุง, ตั้งค่าคะแนน) — ใครทำอะไรกับใคร เมื่อไหร่
- 🔁 **จองซ้ำและคิวรอ** — จองซ้ำรายสัปดาห์/เดือนได้จากหน้า /bookings/new (สูงสุด 12 ครั้ง, ข้ามวันที่ไม่ว่าง), เมื่อช่วงเวลาถูกจองเต็มสามารถ **เข้าคิวรอ** — ระบบแจ้งเตือนคนแรกในคิวเมื่อ slot ว่างลง (ดู/ออกจากคิวที่หน้า /bookings)
- 🛠️ **การซ่อมบำรุงเครื่องมือ** — LAB_ADMIN เพิ่มกำหนดการซ่อม (เครื่องมือ/วัน/เวลา) ที่หน้า /instruments → **ระบบกันการจองช่วงซ่อม** ทั้งเว็บและมือถือ + ปฏิทินแสดงช่วงซ่อม, มีประวัติการซ่อม + Audit log
- ⚙️ **ตั้งค่าเกณฑ์คะแนนผ่าน UI** — หน้า /settings (ผู้ดูแล) ปรับคะแนนเริ่มต้น/เกณฑ์ขั้นต่ำ/โบนัส/คะแนนปลดล็อกได้ทันที (เดิมเป็นค่าคงที่ในโค้ด)

## บทบาทผู้ใช้ (Roles)

| บทบาท | สิทธิ์หลัก |
|---|---|
| ผู้ดูแลระบบ (OWNER) | ทุกสิทธิ์ของผู้ดูแลห้องแล็บ + มอบ/ถอนสิทธิ์ OWNER และ LAB_ADMIN ให้ผู้ใช้อื่น (ระบบบังคับให้เหลือ OWNER ที่ใช้งานอยู่อย่างน้อย 1 คนเสมอ) |
| นักเรียน (STUDENT) | ดูเครื่องมือ, จองช่วงเวลาอิสระ, อัปโหลดรูปหลักฐานหลังใช้, ยกเลิกการจองของตัวเอง |
| ครู (TEACHER) | ดู/จองเอง, ดูคำขอจองและคำขอคืน/ขยายเวลา (อ่านอย่างเดียว) |
| ผู้ดูแลห้องแล็บ (LAB_ADMIN) | เพิ่ม/แก้ไขเครื่องมือ + รูปอุปกรณ์, กำหนดสถานะ, อนุมัติ/ปฏิเสธคำขอจองและคำขอคืน/ขยายเวลา, จัดการผู้ใช้ทั่วไป (บทบาทระดับต่ำ/สถานะ/รหัสผ่าน), ดูรูปหลักฐาน, ปรับคะแนนการใช้งานและปลดล็อกการจอง |
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
| owner@school.ac.th | ผู้ดูแลระบบ |
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
| `CRON_SECRET` | `apps/web/.env` | (ไม่บังคับ) ใช้ป้องกัน endpoint `/api/cron/reminders` ถูกเรียกจากภายนอก (ส่ง `Authorization: Bearer <secret>`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ALLOWED_DOMAIN` | `apps/web/.env` | Google OAuth — ดูหัวข้อ [Google Sign-in (OAuth)](#google-sign-in-oauth) ด้านล่าง |
| `APP_PUBLIC_URL` | `apps/web/.env` | (ไม่บังคับ) URL หลักคงที่ของระบบ — ใช้สร้าง redirect URI ของ Google OAuth แทนการเดาจาก Host header (เหมาะกับ reverse proxy/tunnel ให้ทุกเครื่องใช้ URL เดียวกัน) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | `apps/web/.env` | (ไม่บังคับ) Telegram Bot แจ้งเตือนผู้ดูแล/ระบบ — ฟรี 100% ไม่จำกัดข้อความ (สร้างผ่าน @BotFather, ดูวิธีหา chat_id ด้านล่าง) |
| `TELEGRAM_MESSAGE_STYLE` | `apps/web/.env` | (ไม่บังคับ) รูปแบบสรุปเริ่มต้น `full` (หลายบรรทัด) หรือ `short` (1–2 บรรทัด) — ผู้ดูแลแต่ละคนเลือกเองได้ที่หน้า `/profile` |
| `TELEGRAM_WEBHOOK_SECRET` | `apps/web/.env` | (ไม่บังคับ) secret สำหรับ webhook `/api/telegram/webhook` — ตั้งเมื่อมี URL สาธารณะ; dev ใช้ poller อัตโนมัติไม่ต้องตั้ง |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `apps/mobile/.env` | Google OAuth สำหรับแอปมือถือ — ดูหัวข้อด้านล่าง |

## Google Sign-in (OAuth)

ระบบรองรับ "เข้าสู่ระบบด้วย Google" ทั้ง web และ mobile โดยอนุญาตเฉพาะอีเมลในโดเมนของโรงเรียน (`GOOGLE_ALLOWED_DOMAIN`) และต้องยืนยันอีเมล (`email_verified`) แล้วเท่านั้น บัญชีที่ยังไม่มีในระบบจะถูกสร้างอัตโนมัติ (บทบาทเริ่มต้น `STUDENT`)

### 1. สร้าง OAuth Client IDs ที่ Google Cloud Console

1. เปิด [Google Cloud Console](https://console.cloud.google.com) → เลือกโปรเจกต์ (หรือสร้างใหม่)
2. **APIs & Services → OAuth consent screen** — ตั้งค่า (External, ชื่อแอป, อีเมลผู้ดูแล) และเพิ่มโดเมนที่อนุญาต เช่น `school.ac.th`
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** — สร้างทั้งหมด 3 ประเภท:

| ประเภท | ใช้กับ | ข้อมูลที่ต้องกรอก |
|---|---|---|
| **Web application** | เว็บไซต์ (web) | **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback` (dev) และ `https://<โดเมนโปรดักชัน>/api/auth/google/callback` (prod) |
| **Android** | แอป Android | Package name (จาก `apps/mobile/app.json`/EAS) + **SHA-1** ของ keystore (`keytool -list -v -keystore <ไฟล์> -alias <alias>`) |
| **iOS** | แอป iOS | Bundle identifier (จาก `apps/mobile/app.json`/EAS) |

> Client ID ของ **Web application** ยังใช้กับ Expo Go / web ของแอปมือถือด้วย (ค่า `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)

### 2. ตั้งค่า `apps/web/.env`

```env
GOOGLE_CLIENT_ID="<web client id>"
GOOGLE_CLIENT_SECRET="<web client secret>"
# Allowlist (aud) — ต้องใส่ Client ID ของ Android/iOS ด้วย มิฉะนั้น mobile login จะถูกปฏิเสธ
GOOGLE_ANDROID_CLIENT_ID="<android client id>"
GOOGLE_IOS_CLIENT_ID="<ios client id>"
# โดเมนอีเมลที่อนุญาตให้เข้าสู่ระบบ (ค่าเริ่มต้น: school.ac.th)
GOOGLE_ALLOWED_DOMAIN="pccpl.ac.th"
```

### 3. ตั้งค่า `apps/mobile/.env`

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="<web client id>"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="<android client id>"
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="<ios client id>"
```

### 4. รีสตาร์ทแล้วทดสอบ

- Web: รีสตาร์ท `pnpm dev:web` แล้วกด "เข้าสู่ระบบด้วย Google" ที่หน้า `/login`
- Mobile: รีสตาร์ท Expo แล้วลองที่หน้าล็อกอิน

### หลักการทำงาน & การแก้ปัญหา

- Server ตรวจทั้งหมดนี้ก่อนอนุญาต: (1) `aud` ของ id_token อยู่ใน allowlist ข้างต้น, (2) อีเมลลงท้ายด้วย `@GOOGLE_ALLOWED_DOMAIN`, (3) `email_verified` เป็น `true`
- **`invalid_client` / "The OAuth client was not found"** → Client ID ใน `.env` ไม่มีอยู่ในโปรเจกต์ Google Cloud (ลบไปแล้ว / ผิดโปรเจกต์) — สร้างใหม่แล้วอัปเดต `.env` แล้วรีสตาร์ท
- **`redirect_uri_mismatch`** → ลืมลงทะเบียน redirect URI ที่ใช้จริงใน Authorized redirect URIs ของ Web client (เช่น `http://localhost:3000/api/auth/google/callback` หรือ `https://<โดเมน>/api/auth/google/callback`)
- **เข้าจากเครื่องอื่นใน LAN แล้วขึ้น "localhost ปฏิเสธการเชื่อมต่อ"** → สาเหตุ: Next dev server ปรับ `request.url` เป็น localhost เสมอ แต่ระบบสร้าง redirect URI จาก `Host`/`X-Forwarded-Host` header จริงแล้ว (ตั้งแต่เวอร์ชันนี้) — อ่านหัวข้อ [เข้าถึงจากเครื่องอื่นใน LAN](#เข้าถึงจากเครื่องอื่นใน-lan-google-login) ด้านล่าง
- **ยังไม่ตั้งค่า** → ปุ่มแสดง "ยังไม่ได้ตั้งค่า Google Sign-in" (เมื่อ `GOOGLE_CLIENT_ID` ว่าง)

### แจ้งเตือนผู้ดูแลผ่าน Telegram Bot (ฟรี 100%)

ระบบส่ง Push + Email ให้ผู้ดูแลตามปกติอยู่แล้ว และสามารถส่งข้อความแจ้งเตือนไปยัง **Telegram Bot** เพิ่มเติม (ฟรี ไม่จำกัดข้อความ) เมื่อมีเหตุการณ์สำคัญ:

- มีคำขอจองใหม่ (ทั้งจาก web และ mobile)
- มีคำขอคืนเครื่องก่อนเวลา / ขยายเวลา
- **คะแนนผู้ใช้ต่ำกว่าเกณฑ์ 50** (ข้ามเส้นจาก ≥50 → <50) — พร้อมลิงก์ตรงไปหน้า `/users/<id>` ให้ผู้ดูแลปลดล็อกได้ทันที (แจ้งครั้งเดียวตอนข้ามเส้น ไม่รบกวนซ้ำ)

ทุกข้อความที่มีลิงก์จะแนบปุ่ม **"กดเพื่อเปิดรายละเอียด"** ในข้อความด้วย (deep link ไปยังหน้า booking/request ที่เจาะจง เช่น `/bookings#request-<id>`, `/bookings#booking-<id>`, `/users/<id>`) — กดปุ่มเปิดใน browser ได้ทันที

**วิธีตั้งค่า:**

1. เปิด Telegram → คุยกับ **[@BotFather](https://t.me/BotFather)** → ส่ง `/newbot` → ตั้งชื่อ bot → ได้ **Bot Token**
2. สร้างกลุ่ม (เช่น "SciLab ผู้ดูแล") → เพิ่ม bot เข้ากลุ่ม → **ส่งข้อความอะไรก็ได้ในกลุ่ม** (สำคัญ: bot ต้องได้รับข้อความก่อน ไม่งั้นหา chat_id ไม่เจอ)
3. หา `chat_id`: รันสคริปต์ช่วยหา (พิมพ์ token แทน `<TOKEN>`):

```bash
cd apps/web
TELEGRAM_BOT_TOKEN="<TOKEN>" node scripts/telegram-chat-id.mjs
```

   สคริปต์จะตรวจ token, ให้ส่งข้อความไปที่ bot/กลุ่ม แล้วแสดง `chat_id` ให้ (กลุ่มขึ้นต้นด้วย `-100...`)
   หรือหาเอง: เปิด `https://api.telegram.org/bot<TOKEN>/getUpdates` → ดูค่า `chat.id`
4. ใส่ลง `apps/web/.env` แล้วรีสตาร์ท:

```env
TELEGRAM_BOT_TOKEN="<bot token จาก BotFather>"
TELEGRAM_CHAT_ID="-100xxxxxxxxxxxx"
```

> ไม่ตั้งก็ได้ — ระบบจะข้ามไปเงียบ ๆ เหมือน SMTP ที่ไม่บังคับ ข้อความรองรับ HTML (bold title + เนื้อหา)

### กดอนุมัติ/ปฏิเสธจาก Telegram (inline keyboard)

ข้อความ Telegram ที่แจ้ง "มีคำขอคืน/ขยายเวลา" จะแนบปุ่ม **✅ อนุมัติ** / **❌ ปฏิเสธ** ให้ผู้ดูแลกดจากแชทได้เลย (ไม่ต้องเปิดเว็บ) — ระบบตรวจสิทธิ์ก่อนอนุมัติและบันทึกชื่อผู้ตัดสิน

**วิธีเปิดใช้งาน:**

1. **หา Telegram User ID ของตัวเอง** — ส่งข้อความหา [@userinfobot](https://t.me/userinfobot) ใน Telegram แล้วดูเลข "Id" (เช่น `8760710517`)
2. **ผูกกับบัญชี** — เข้า `/profile` → กรอกเลขลงช่อง "Telegram User ID (สำหรับผู้ดูแลที่ต้องการกดอนุมัติ/ปฏิเสธจากแชท)" → บันทึก (เฉพาะผู้ที่กดได้ ต้องมีบทบาท LAB_ADMIN/OWNER)
3. **เลือกรูปแบบสรุป** — ช่อง "รูปแบบการแจ้งเตือน Telegram" ในหน้า `/profile`: **สรุปเต็ม** (ทุกบรรทัด) / **สรุปสั้น** (1–2 บรรทัด) / **ใช้ค่าเริ่มต้นจากระบบ** (ค่า `TELEGRAM_MESSAGE_STYLE` ใน env, ค่าเริ่มต้น `full`)
4. ครั้งถัดไปที่มีคำขอคืน/ขยายเวลาใหม่ ข้อความ Telegram จะมีปุ่ม — กดเลย ระบบจะตอบกลับ "✅ อนุมัติแล้ว / ❌ ปฏิเสธแล้ว" และปิดปุ่ม

> **การส่งถึงผู้ดูแลแต่ละคน:** เมื่อมีผู้ดูแลที่ผูก Telegram User ID แล้ว ระบบจะส่งข้อความ**ถึงแชทส่วนตัวของผู้ดูแลแต่ละคน** ตามรูปแบบที่แต่ละคนเลือก (ผู้ดูแลที่ยังไม่ได้เลือกใช้ค่าเริ่มต้นจาก env) — ถ้ายังไม่มีใครผูก ระบบส่งไป `TELEGRAM_CHAT_ID` (กลุ่ม) ตามเดิม

**dev (ไม่มี URL สาธารณะ):** ระบบ poll `getUpdates` อัตโนมัติ (ทุก 5 วิ) ไม่ต้องตั้งอะไรเพิ่ม

**production (มี domain/tunnel):** ตั้ง webhook เพื่อรับ callback ทันที (แทน poll):

```bash
# ตั้ง TELEGRAM_WEBHOOK_SECRET ใน .env ก่อน แล้ว:
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=<APP_PUBLIC_URL>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

> หมายเหตุ: ถ้าใช้ webhook แล้ว ระบบจะหยุด poll อัตโนมัติ (กันรับซ้ำ)

### เข้าถึงจากเครื่องอื่นใน LAN (Google login)

Google อนุญาต redirect URI ที่เป็น **HTTPS เท่านั้น** (ยกเว้น `localhost`/`127.0.0.1`) — ลงทะเบียน `http://<IP>:3000/...` ไม่ได้ และถ้าเข้าผ่าน `http://<IP>:3000` โดยตรง Google จะ redirect กลับไปที่ `localhost:3000` บนเครื่องของผู้ใช้เอง (เพราะโค้ดสร้าง redirect URI จาก host ที่เข้าจริงตอนนั้น) จนขึ้น "ปฏิเสธการเชื่อมต่อ"

ทางที่ถูกต้องคือใช้ **URL เดียวคงที่ (HTTPS)** ที่ทุกเครื่องเข้าผ่านกัน แล้วลงทะเบียน redirect URI ของ URL นั้นตัวเดียว:

**ตัวเลือก ก — reverse proxy (แนะนำ):** รัน Caddy (หรือ nginx) บนเครื่อง server หน้าต่อ port 3000 ตามตัวอย่าง `apps/web/Caddyfile.example`

```bash
# แก้ <domain> ใน Caddyfile.example แล้วรัน:
brew install caddy
cd apps/web && caddy run --config Caddyfile.example
```

- ถ้า `<domain>` เป็น domain จริง (เช่น `scilab.pccpl.ac.th` ชี้มาที่เครื่อง) Caddy ออก Let's Encrypt cert ให้อัตโนมัติ
- ถ้าเป็นชื่อ LAN ไม่ public (เช่น `scilab.lab`) ต้องใช้ [mkcert](https://github.com/FiloSottile/mkcert) สร้าง cert แล้วติดตั้ง CA บนเครื่องไคลเอนต์ทุกเครื่อง (Google ยังต้องการ HTTPS อยู่ดี)
- ทุกเครื่องเข้าผ่าน `https://<domain>` และลงทะเบียน `https://<domain>/api/auth/google/callback` ใน Google Console

**ตัวเลือก ข — tunnel:** ใช้ [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) หรือ ngrok ชี้ไปที่ `localhost:3000` จะได้ URL `https://...` ใช้เป็น `APP_PUBLIC_URL` ได้ทันที (ไม่ต้องตั้ง DNS)

**ตั้งค่าในโค้ด (ไม่บังคับ):** ถ้าตั้ง `APP_PUBLIC_URL` ใน `apps/web/.env` (เช่น `https://scilab.example.com`) ระบบจะใช้ URL นั้นสร้าง redirect URI เสมอ แทนที่จะเดาจาก Host header — เหมาะกับกรณีมี proxy หลายตัว/หลาย IP แต่ต้องการ redirect URI เดียว

```env
# apps/web/.env
APP_PUBLIC_URL="https://scilab.example.com"
```

## ระบบแจ้งเตือนล่วงหน้า (Reminder)

- ผู้จองเลือก `reminderOffsetMinutes` (0 = ไม่แจ้ง, 15/30/60/120 นาทีก่อนเริ่ม) ตอนยื่นคำขอบน web/mobile
- ตัว scheduler ภายใน (`lib/scheduler.ts`) ทำงานทุก 60 วินาทีเมื่อ server รัน (ผ่าน `instrumentation.ts`), ส่งเฉพาะ booking ที่สถานะ `APPROVED`, `reminderSentAt` ยังว่าง และถึงเวลา (และยังไม่เกิน 24 ชม. หลังจากถึงกำหนด)
- สำหรับ production ควรเรียก `/api/cron/reminders` เป็น cron แทน (เช่น GitHub Actions/Vercel Cron) พร้อมส่ง `CRON_SECRET`

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

> สถานะ: ✅ เสร็จสมบูรณ์ 38/40 งาน (M1–M38) · 🚧 เหลือ 2 งาน (M39, M40 — รอการลงมือ: ลงทะเบียน OAuth ใน Google Console + สร้าง Postgres/link Vercel; โค้ดและ config เตรียมพร้อมแล้ว) ดูหัวข้อ [เข้าสู่ระบบด้วย Google บนมือถือ (M39)](#เข้าสู่ระบบด้วย-google-บนมือถือ-m39) และ [Deploy Production](#deploy-production)

### ✅ เสร็จสมบูรณ์

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
- [x] M16 แจ้งเตือนล่วงหน้าก่อนเริ่มจอง (เลือก 15/30/60/120 นาที, Push + Email, cron/scheduler ในตัว)
- [x] M17 มุมมองปฏิทิน (รายเดือน/ช่วงวันที่, กรองเครื่องมือ-สถานะ)
- [x] M18 ระบบขอคืน/ขยายเวลาการจอง (ส่งคำขอ → แอดมินอนุมัติ/ปฏิเสธ)
- [x] M19 ประวัติการจองส่วนตัว (กรอง/ค้นหา + export CSV)
- [x] M20 หน้า Homepage สาธารณะแสดงโครงงานดีเด่น (โฆษณาผลงานนักเรียน, LAB_ADMIN จัดการผ่าน /projects)
- [x] M21 ดูการใช้งานรายบุคคล (สถิติ ชาร์ต และประวัติการจองต่อผู้ใช้ — LAB_ADMIN/TEACHER ผ่าน /users/[id])
- [x] M22 Homepage เพิ่ม Image Slider เน้นโครงงานดาวเด่น + จัดเรียงโครงงานเป็นรายปี (เพิ่มฟิลด์ year, จัดกลุ่มทั้งหน้าแรกและหน้า /projects)
- [x] M23 เข้าสู่ระบบ/สมัครสมาชิก → กลับไปหน้า Homepage + ปุ่มกลับหน้าแรกบนหน้า login/register
- [x] M24 สิทธิ์การอนุมัติเฉพาะ LAB_ADMIN + ตัด QR เช็คอิน/เช็คเอาท์ — ครูดูได้อย่างเดียว (อ่านอย่างเดียว), ผู้จองขอคืน/ขยายได้จากสถานะ APPROVED, อัปโหลดรูปหลักฐานหลังจองเสร็จสิ้นเท่านั้น, ตรวจห้ามจองข้ามวัน (เวลาเริ่ม-สิ้นสุดต้องอยู่ในวันเดียวกัน)
- [x] M25 ความปลอดภัยและกัน error ของ API — ตรวจสถานะบัญชี (isActive) ทุก request, ตรวจสอบวันที่/สถานะในพารามิเตอร์ (calendar/bookings), route ทั้งหมดคืน error เป็น JSON แทนการ crash, ป้องกัน CSV formula injection ใน export, rate limit การเข้าสู่ระบบ (5 ครั้ง/15 นาที), ป้องกันการแย่ง push token ระหว่างผู้ใช้, ตรวจสอบ magic bytes ของรูปหลักฐาน
- [x] M26 บทบาทผู้ดูแลระบบ (OWNER) — มอบ/ถอนสิทธิ์ OWNER และ LAB_ADMIN ให้ผู้ใช้อื่นได้ (เฉพาะ OWNER), ลบผู้ใช้, ค้นหา/กรองผู้ใช้ในหน้าจัดการ, บังคับให้เหลือ OWNER/LAB_ADMIN ที่ใช้งานอยู่อย่างน้อย 1 คน
- [x] M27 ระบบคะแนนการใช้งาน — คะแนนเริ่มต้น 100, ได้คะแนนเมื่อคืนเครื่องก่อนเวลา/ตรงเวลาและอัปโหลดรูปหลักฐานหลังใช้, แอดมินเพิ่ม/หักคะแนนพร้อมเหตุผล, ต่ำกว่า 50 คะแนนถูกระงับการจอง (web + mobile) และปลดล็อกได้เฉพาะ LAB_ADMIN/OWNER; แสดงคะแนนในทุกส่วนที่เห็นผู้ใช้อื่น (หน้า /users, /users/[id], /bookings, แดชบอร์ด, ปฏิทิน web + mobile)
- [x] M28 ปรับ UI ให้ responsive — navbar แสดงแถวลิงก์บนที่ ≥768px และแถวเลื่อนแนวนอนบนจอมือถือ, ซ่อนชื่อผู้ใช้บนจอเล็ก, ปรับ padding/gap ให้ nav 9 ลิงก์พอดีที่ 768px; ตรวจแล้วทุกหน้าไม่มี horizontal overflow (dashboard, bookings, calendar, users, history, reports, projects, homepage) — ตาราง/ปฏิทิน/กราฟเลื่อนภายในหรือปรับขนาดอัตโนมัติ
- [x] M29 เมนูแฮมเบอร์เกอร์บนมือถือ — แทนแถวเลื่อนแนวนอนด้วย dropdown เปิด/ปิดได้ แบ่งกลุ่ม เมนูหลัก/จัดการ, ปิดอัตโนมัติเมื่อนำทาง/กด Escape/คลิกด้านนอก
- [x] M30 ประวัติการปรับคะแนนแบบถาวร — โมเดล ScoreLog (change/scoreAfter/source/ผู้ทำ), บันทึกอัตโนมัติทั้งปรับมือ, คืนเครื่องตรงเวลา, อัปโหลดรูปหลักฐาน, ปลดล็อก — แสดงในหน้า /users/[id]
- [x] M31 แจ้งเตือนคะแนน — ใส่คะแนนปัจจุบันของผู้ขอใน Push และอีเมลแจ้งเตือนผู้ดูแลเมื่อมีคำขอจองใหม่ (web + mobile API)
- [x] M32 ระบบแจ้งเตือนในแอป (ศูนย์การแจ้งเตือน) — หน้า /notifications แสดงรายการ อ่าน/ยังไม่อ่าน + ปุ่ม “อ่านทั้งหมด” + กระดิ่งพร้อม badge จำนวนที่ยังไม่อ่านใน navbar
- [x] M33 จองซ้ำและคิวรอ — จองซ้ำรายสัปดาห์/เดือน (สูงสุด 12 ครั้ง, ข้ามวันที่ไม่ว่างอัตโนมัติ, แจ้งผู้ดูแลครั้งเดียวพร้อมสรุปจำนวนครั้ง) + คิวรอเมื่อเครื่องมือเต็ม: เข้าคิวจากหน้า /bookings/new เมื่อช่วงเวลาทับซ้อน, ระบบแจ้งเตือน (ในแอป + Push) คนแรกในคิวเมื่อ slot ว่างลง (จองถูกยกเลิก/ปฏิเสธ), ดู/ออกจากคิวได้ที่หน้า /bookings; ทั้ง web และ mobile API
- [x] M34 ตารางการซ่อมบำรุงเครื่องมือ — LAB_ADMIN/OWNER เพิ่มกำหนดการซ่อม (เครื่องมือ/วันที่/เวลา/หัวข้อ) ที่หน้า /instruments, สถานะ รอซ่อม/กำลังซ่อม/ซ่อมเสร็จ/ยกเลิก, **กันการจองช่วงซ่อมอัตโนมัติ** (เช็คเดียวกันกับการจองชน ทั้ง web + mobile + ปฏิทินแสดงเป็นช่วงที่ไม่ว่าง), ประวัติการซ่อมย้อนหลัง, บันทึก Audit log
- [x] M35 Pagination รายการยาว — /users และ /history แบ่งหน้า 20 รายการ/หน้า พร้อมปุ่มก่อนหน้า/ถัดไป และตัดให้หน้าเกินเป็นหน้าสุดท้าย
- [x] M36 รายงานช่วงวันที่กำหนดเอง + พิมพ์ PDF — ตัวกรองวันที่ (from/to) บนหน้า /reports ส่งผลกับทุกกราฟ (รวมกราฟแนวโน้มที่ปรับช่วงตามวันที่เลือก สูงสุด 31 วัน) และ export CSV, ปุ่ม “พิมพ์รายงาน (PDF)” ผ่าน browser print
- [x] M37 Audit log ผู้ดูแล — โมเดล AuditLog บันทึก เปลี่ยนบทบาท/ระงับ-เปิดบัญชี/ตั้งรหัสผ่าน/ลบผู้ใช้ (ใครทำอะไรกับใคร) + หน้า /audit รวมประวัติการจัดการกับประวัติคะแนน
- [x] M38 ตั้งค่าเกณฑ์คะแนนผ่าน UI — หน้า /settings (ผู้ดูแล): คะแนนเริ่มต้น, เกณฑ์ขั้นต่ำ 50, โบนัสคืนเครื่อง, โบนัสหลักฐาน, คะแนนปลดล็อก — ใช้ได้จริงทุกจุด (ระงับการจอง, ให้คะแนน, ปลดล็อก, badge เขียว/เหลือง/แดง, แจ้งเตือน Telegram ต่ำกว่าเกณฑ์) บันทึก Audit log

### 🚧 เหลือ 2 งาน (ต้องใช้บัญชีภายนอก: Google Console + สร้าง Postgres/link Vercel)

- [ ] M39 Mobile Google Sign-in จริง — โค้ดพร้อมแล้ว (expo-auth-session + allowlist ฝั่ง server รองรับ Web/Android/iOS client ID) **เหลือขั้นตอนฝั่ง Google Console** — ดูหัวข้อ [เข้าสู่ระบบด้วย Google บนมือถือ (M39)](#เข้าสู่ระบบด้วย-google-บนมือถือ-m39)
- [ ] M40 Deploy Production — **เตรียมพร้อมแล้ว**: กลไกสลับ SQLite⇄Postgres (schema เดียว + provider.ts + adapter อัตโนมัติ), buildCommand Vercel (สลับ postgres → generate → build, ทดสอบผ่าน), cron `*/5` `/api/cron/reminders` (CRON_SECRET), `.env.production.example`, eas.json, smoke test Postgres (PGlite) — **เหลือการลงมือ deploy** (สร้าง Postgres + link Vercel ต้องใช้บัญชีคุณ) — ดูหัวข้อ [Deploy Production](#deploy-production)

---

## เข้าสู่ระบบด้วย Google บนมือถือ (M39)

**สถานะ: ✅ ครึ่งแรกเสร็จแล้ว** — โค้ด + identifiers + web client ID ตั้งครบแล้ว; เหลือการลงทะเบียน Android/iOS client ใน Google Console แล้วใส่ client ID กลับมา (ต้องใช้บัญชี Google ของผู้ดูแล — ลงทะเบียนเองในเบราว์เซอร์)

### Identifiers ของแอป (ตั้งแล้วใน `apps/mobile/app.json`)

| แพลตฟอร์ม | ค่า |
|---|---|
| Android package name | `com.scilab.app` |
| iOS bundle identifier | `com.scilab.app` |

### สิ่งที่ตั้งแล้ว (ไม่ต้องทำซ้ำ)

- `apps/mobile/app.json` → มี `android.package` + `ios.bundleIdentifier` แล้ว
- `apps/mobile/.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = web client ID จริง (ใช้ได้ทันทีใน Expo Go / web)
- `apps/web/.env` → มีช่อง `GOOGLE_ANDROID_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` (ว่างรอค่า)

### ขั้นตอนที่เหลือ (ลงทะเบียนใน Google Console)

1. **Android** — Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID → Android**
   - **Package name** = `com.scilab.app` (ต้องตรงกับ app.json พอดี)
   - **SHA-1 certificate fingerprint** — หาได้จากวิธีใดวิธีหนึ่ง:
     - `npx expo prebuild` แล้ว `cd android && ./gradlew signingReport` (ค่า **debug** ใช้ตอน dev)
     - หลัง `eas build` ครั้งแรก: Google Play Console → App integrity → App signing → SHA-1 (ค่า release)
     - ต้องการ SHA-1 ของ debug keystore: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - บันทึก **Android client ID** (เช่น `xxxx.apps.googleusercontent.com`)
2. **iOS** — **Create OAuth client ID → iOS** ด้วย **Bundle ID** = `com.scilab.app` → บันทึก **iOS client ID**
   - หมายเหตุ: การลงชื่อ iOS build ต้องมี Apple Developer account (ฟรีสำหรับทดสอบใน Expo Go — ใช้ web client ID แทนได้)
3. **นำ client ID ทั้ง 2 ค่ามาใส่**:
   - `apps/web/.env`: `GOOGLE_ANDROID_CLIENT_ID="..."` และ `GOOGLE_IOS_CLIENT_ID="..."`
   - `apps/mobile/.env`: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="..."` และ `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="..."`
4. **ทดสอบทันที (ไม่ต้องรอ Android/iOS client)**: ใช้ **Expo Go** — ปุ่ม “เข้าสู่ระบบด้วย Google” จะใช้ web client ID ทำงานได้เลย (ต้องรัน web server ด้วย IP LAN: ตั้ง `EXPO_PUBLIC_API_URL=http://<ip>:3000` แล้วเปิด Google OAuth redirect ให้ `http://<ip>:3000/api/auth/google/callback`)
5. ตรวจ `GOOGLE_ALLOWED_DOMAIN` — ตอนนี้ = `pccpl.ac.th` (เฉพาะอีเมล @pccpl.ac.th เท่านั้น)

> server จะปฏิเสธ token ที่ `aud` ไม่อยู่ใน allowlist (`GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`) — ต้องตั้งทั้ง 3 ตัวใน `apps/web/.env` ให้ครบก่อนทดสอบจากแอปจริง

---

## Deploy Production (M40)

**สถานะ: ✅ เตรียมพร้อมแล้ว** — กลไกสลับ SQLite/Postgres (schema เดียว + สคริปต์), buildCommand Vercel ทำงานจริง (ทดสอบ local แล้ว), cron แก้เป็นทุก 5 นาที, `.env.production.example` ครบ; **เหลือขั้นตอนที่ต้องใช้บัญชีของคุณ** (สร้าง Postgres + link Vercel)

### กลไกสลับ SQLite ⇄ Postgres (ทำไว้แล้ว)

- สคริปต์ `packages/db/scripts/set-provider.mjs` + npm script:
  ```bash
  pnpm db:use:sqlite      # dev: schema → sqlite + generate client + เขียน provider.ts
  pnpm db:use:postgres    # prod: schema → postgresql + generate client + เขียน provider.ts
  ```
- `packages/db/src/index.ts` เลือก driver adapter (better-sqlite3 / pg) **จาก provider.ts ที่เขียนตอนสลับ** → adapter ตรงกับ client เสมอ
- ทดสอบแล้ว: Postgres path ผ่าน smoke test 11 รายการ (PGlite) + `next build` ผ่าน; กลับ sqlite แล้ว dev ทำงานปกติ
- หมายเหตุ: `contains` ใน Prisma บน Postgres เป็น case-sensitive (ต่างจาก SQLite) — หน้า /users แก้ให้ insensitive เฉพาะ Postgres แล้ว

### 1) ฐานข้อมูล Postgres

```bash
# 1. สร้าง Postgres (Supabase/Neon/AWS RDS) แล้วเอา connection string ไปใส่
#    (URL ขึ้นต้น postgres:// → ระบบสลับ provider ให้อัตโนมัติตอน build)
# 2. สร้าง migration ครั้งแรกบนฐานใหม่ (ลบ migrations sqlite เดิมก่อน — คนละภาษา SQL)
rm -rf packages/db/prisma/migrations
pnpm db:use:postgres
DATABASE_URL="postgresql://..." pnpm --filter @scilab/db exec prisma migrate dev --name init
# 3. production: apply migration
pnpm db:migrate:deploy
# 4. ทดสอบ migration SQL / query บน Postgres โดยไม่ต้องมี server (PGlite, WASM Postgres)
pnpm db:use:postgres && pnpm --filter @scilab/db exec tsx scripts/pg-smoke-test.ts <migration.sql>
```

### 2) Web — Vercel

- Framework preset: **Next.js**; `vercel.json` (repo root) ตั้งแล้ว: `rootDirectory: apps/web`, `buildCommand: pnpm --filter @scilab/db run db:use:postgres && pnpm build` (สลับเป็น Postgres + generate client ก่อน build — ทดสอบ local ผ่านแล้ว), cron `*/5 * * * *`
- ตั้ง env ทั้งหมดตาม `apps/web/.env.production.example` (GOOGLE_*, SESSION_SECRET, DATABASE_URL=postgres, SMTP_*, TELEGRAM_*, APP_PUBLIC_URL=URL จริง https)
- **Vercel Cron ฟรีเฉพาะ Hobby 1 งาน** — ถ้าเกิน แนะนำ cron บริการอื่น (cron-job.org ฟรี) เรียก `/api/cron/reminders` พร้อม `x-cron-secret`
- ลงทะเบียน redirect URI ใน Google Console: `https://<URL>/api/auth/google/callback` + ตั้ง `APP_PUBLIC_URL`

### 3) Mobile — APK/IPA ผ่าน EAS

```bash
cd apps/mobile
pnpm install
# ตั้งค่า EXPO_PUBLIC_API_URL / EXPO_PUBLIC_GOOGLE_* ใน eas.json หรือ env
eas build -p android --profile preview    # APK ลงเครื่องเอง
eas build -p android --profile production
eas build -p ios --profile production     # ต้องมี Apple Developer account
```

### 4) หลัง deploy

- [ ] Google OAuth web redirect URI + SHA-1 ลงทะเบียนครบ
- [ ] `CRON_SECRET` ตั้งแล้ว และ cron ทำงาน (ตรวจ log Vercel)
- [ ] Telegram webhook แทน poller: ตั้ง `TELEGRAM_WEBHOOK_SECRET` + `setWebhook` → `https://<URL>/api/telegram/webhook`
- [ ] ผู้ดูแลผูก Telegram User ID + เลือกรูปแบบสรุปในหน้า `/profile`
