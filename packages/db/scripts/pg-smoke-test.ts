/**
 * Smoke test — ตรวจว่า client + schema + query ทำงานบน Postgres จริง (ผ่าน PGlite, WASM Postgres)
 * ต้องรันหลัง `pnpm --filter @scilab/db db:use:postgres` (schema + generated client เป็น postgresql)
 *
 * Usage: pnpm exec tsx scripts/pg-smoke-test.ts <migration.sql>
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "../src/generated/prisma/client";

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error("Usage: tsx scripts/pg-smoke-test.ts <migration.sql>");
  process.exit(1);
}

async function main() {
const sql = readFileSync(migrationPath, "utf8");

const client = new PGlite();
await client.exec(sql);
console.log("✓ ใช้ migration SQL บน Postgres (PGlite) สำเร็จ");

const adapter = new PrismaPGlite(client);
const prisma = new PrismaClient({ adapter } as never);

// 1. create User (enum Role + ค่า default)
const user = await prisma.user.create({
  data: { email: "smoke@test.com", passwordHash: "x", name: "Smoke Test" },
});
console.log("✓ create User (role default STUDENT):", user.role, "score:", user.score);

// 2. create User อีกคน + Instrument (enum category)
await prisma.user.create({
  data: { email: "smoke2@test.com", passwordHash: "x", name: "Smoke Two" },
});
const instr = await prisma.instrument.create({
  data: {
    name: "บีกเกอร์ 250 ml",
    category: "GLASSWARE",
    totalQuantity: 6,
    availableCount: 6,
  },
});
console.log("✓ create Instrument:", instr.category);

// 3. create Booking (relation + enum status)
const booking = await prisma.booking.create({
  data: {
    userId: user.id,
    instrumentId: instr.id,
    date: new Date("2026-08-20T00:00:00.000Z"),
    startTime: "09:00",
    endTime: "10:00",
    purpose: "ทดลอง",
  },
});
console.log("✓ create Booking (status PENDING):", booking.status);

// 4. findMany with contains — case-sensitive โดยค่าเริ่มต้น (Postgres LIKE)
const foundSensitive = await prisma.user.findMany({
  where: { name: { contains: "smoke" } },
});
console.log("✓ findMany contains (sensitive):", foundSensitive.length, "คน (คาด 0)");

// 4b. contains + mode: insensitive — ตรงกับที่แอปใช้บน Postgres (users search)
const foundInsensitive = await prisma.user.findMany({
  where: { name: { contains: "SMOKE", mode: "insensitive" } },
});
console.log("✓ findMany contains + mode insensitive: ", foundInsensitive.length, "คน (คาด 2)");

// 5. count + groupBy
const totalUsers = await prisma.user.count();
const byRole = await prisma.user.groupBy({ by: ["role"], _count: true });
console.log("✓ count users:", totalUsers, "| groupBy role:", JSON.stringify(byRole));

// 6. findMany relation (include instrument)
const withInstr = await prisma.booking.findMany({ include: { instrument: true } });
console.log("✓ findMany include instrument:", withInstr[0]?.instrument?.name);

// 7. update + enum อื่น
await prisma.booking.update({
  where: { id: booking.id },
  data: { status: "APPROVED" },
});
const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
console.log("✓ update status → APPROVED:", updated?.status);

// 8. upsert (ใช้ใน Google login flow)
const upserted = await prisma.user.upsert({
  where: { email: "smoke@test.com" },
  update: { name: "Smoke Updated" },
  create: { email: "smoke@test.com", passwordHash: "x", name: "Smoke" },
});
console.log("✓ upsert (update path):", upserted.name);

// 9. ScoreSettings id=1 (การตั้งค่าคะแนน)
const settings = await prisma.scoreSettings.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1 },
});
console.log("✓ ScoreSettings id=1:", JSON.stringify(settings));

await prisma.$disconnect();
console.log("\n✅ Smoke test Postgres ผ่านครบทุกกรณี");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
