import { PrismaClient } from './generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'

/**
 * เลือก adapter ให้ตรงกับ client ที่ generate ไว้เสมอ:
 * - อ่านจากไฟล์ src/generated/provider.ts (เขียนโดย `pnpm db:use:sqlite|postgres`)
 * - ถ้าไฟล์ยังไม่มี (เช่น ยังไม่เคยรัน db:use:*) → เดาจากรูปแบบ DATABASE_URL
 *
 * ⚠️ adapter ต้องตรงกับ provider ของ schema ตอน generate
 * (sqlite client + pg adapter (หรือกลับกัน) จะ error ทันที)
 */
function resolveProvider(): 'sqlite' | 'postgresql' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { activeProvider } = require('./generated/provider') as {
      activeProvider: 'sqlite' | 'postgresql'
    }
    if (activeProvider === 'sqlite' || activeProvider === 'postgresql') {
      return activeProvider
    }
  } catch {
    // ไม่มีไฟล์ provider → เดาจาก DATABASE_URL
  }
  return /^postgres(ql):\/\//.test(url) ? 'postgresql' : 'sqlite'
}

const provider = resolveProvider()

const adapter =
  provider === 'postgresql'
    ? new PrismaPg(new pg.Pool({ connectionString: url }))
    : new PrismaBetterSqlite3({ url })

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter } as never)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export * from './generated/prisma/client'
