# SciLab Booking — Mobile

Mobile app (React Native + Expo) ของระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์
ใช้ **Expo SDK 57** + **expo-router** + **TypeScript**

เรียกใช้งาน web backend ผ่าน REST API เดียวกัน (ดู [README หลัก](../../README.md) สำหรับภาพรวมทั้งโปรเจกต์)

## เริ่มต้น

```bash
# ติดตั้ง dependencies
pnpm install

# เซ็ต API URL ของ web backend
cp .env.example .env  # แก้ EXPO_PUBLIC_API_URL เช่น http://192.168.1.10:3000

# รัน app
pnpm start        # Expo dev server
pnpm ios          # รันบน iOS simulator
pnpm android      # รันบน Android emulator
```

> หมายเหตุ: เครื่องมือที่รัน mobile ต้องเข้าถึง web backend ได้ — ใช้ IP ในเครื่องเดียวกัน ไม่ใช่ `localhost`
> (ยกเว้นตอนรันบน web: `pnpm web`)

## Scripts

| คำสั่ง | ความหมาย |
|---|---|
| `pnpm start` | เปิด Expo dev server |
| `pnpm ios` / `pnpm android` | รันบน simulator/emulator |
| `pnpm web` | รันบน browser (react-native-web) |
| `pnpm lint` | lint (expo lint) |
| `pnpm exec tsc --noEmit` | ตรวจ type |

## โครงสร้างหลัก

```
src/app/(tabs)/      # หน้าหลัก: index (เครื่องมือ), bookings, new-booking, scan, profile
src/components/      # Shared components (time-range-picker)
src/lib/             # api.ts (REST client), auth.ts (login/token ผ่าน expo-secure-store)
```

## จุดสำคัญ

- **Auth:** login ผ่าน `/api/auth/login` เก็บ token ใน SecureStore แล้วส่ง `Authorization: Bearer` กับทุก request
- **การจอง:** หน้าจองใหม่ใช้ตาราง timeline (`time-range-picker.tsx`) โหลดช่วงที่จองแล้วจาก `/api/bookings/availability`
- **Push:** ลงทะเบียน push token ผ่าน `/api/devices` (ใช้ expo-notifications)
- **QR:** สแกน QR เพื่อเช็คอิน/เช็คเอาท์ (expo-camera)
- **รูปหลักฐาน:** อัปโหลดผ่าน expo-image-picker + `FormData`

## Environment Variables

| ตัวแปร | คำอธิบาย |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL ของ web backend (เช่น `http://192.168.1.10:3000`) |
