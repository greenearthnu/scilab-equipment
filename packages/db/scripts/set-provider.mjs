#!/usr/bin/env node
/**
 * สลับ datasource provider ใน schema.prisma ระหว่าง sqlite (dev) กับ postgresql (production)
 * ใช้ schema เดียวเป็นแหล่งเดียว — หลังสลับต้องรัน `prisma generate` (ทำไว้ใน npm script แล้ว)
 *
 * Usage: node scripts/set-provider.mjs <sqlite|postgresql>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const target = process.argv[2]
if (!['sqlite', 'postgresql'].includes(target)) {
  console.error('Usage: node scripts/set-provider.mjs <sqlite|postgresql>')
  process.exit(1)
}

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'prisma',
  'schema.prisma'
)

let schema = readFileSync(schemaPath, 'utf8')

const current = schema.match(/provider = "(sqlite|postgresql)"/)?.[1]
if (!current) {
  console.error('ไม่พบ datasource provider ใน schema.prisma')
  process.exit(1)
}

if (current !== target) {
  schema = schema.replace(
    /provider = "(sqlite|postgresql)"/,
    `provider = "${target}"`
  )
  writeFileSync(schemaPath, schema)
}

// เขียนไฟล์ provider ที่ src/index.ts อ่าน เพื่อให้ adapter ตรงกับ client ที่ generate เสมอ
// (เขียนทุกครั้ง แม้ไม่ต้องสลับ — เผื่อไฟล์ถูกลบ)
const providerFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'generated',
  'provider.ts'
)
writeFileSync(
  providerFile,
  `// สร้างอัตโนมัติโดย scripts/set-provider.mjs — อย่าแก้ด้วยมือ\nexport const activeProvider = "${target}"\n`
)
console.log(
  current === target
    ? `provider เป็น ${target} อยู่แล้ว — เขียน provider.ts แล้ว`
    : `สลับ provider: ${current} → ${target} (อย่าลืมรัน prisma generate)`
)
