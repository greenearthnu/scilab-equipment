import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = 'Password123!'

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.ac.th' },
    update: {},
    create: {
      email: 'admin@school.ac.th',
      passwordHash,
      name: 'ผู้ดูแลห้องปฏิบัติการ',
      role: 'LAB_ADMIN',
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.ac.th' },
    update: {},
    create: {
      email: 'teacher@school.ac.th',
      passwordHash,
      name: 'ครูวิทยาศาสตร์',
      role: 'TEACHER',
    },
  })

  const executive = await prisma.user.upsert({
    where: { email: 'executive@school.ac.th' },
    update: {},
    create: {
      email: 'executive@school.ac.th',
      passwordHash,
      name: 'รองผู้อำนวยการ',
      role: 'EXECUTIVE',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@school.ac.th' },
    update: {},
    create: {
      email: 'student@school.ac.th',
      passwordHash,
      name: 'นักเรียน ม.4/1',
      role: 'STUDENT',
      className: 'ม.4/1',
    },
  })

  const microscope = await prisma.instrument.upsert({
    where: { id: 'inst-microscope' },
    update: {},
    create: {
      id: 'inst-microscope',
      name: 'กล้องจุลทรรศน์แบบใช้แสง',
      category: 'MICROSCOPE',
      description: 'กล้องจุลทรรศน์สำหรับศึกษาเซลล์ กำลังขยาย 40x-400x',
      totalQuantity: 10,
      availableCount: 10,
      location: 'ห้องแล็บ 1',
    },
  })

  const balance = await prisma.instrument.upsert({
    where: { id: 'inst-balance' },
    update: {},
    create: {
      id: 'inst-balance',
      name: 'เครื่องชั่งไฟฟ้าสองตำแหน่ง',
      category: 'MEASURING',
      description: 'เครื่องชั่งดิจิทัลความละเอียด 0.01 กรัม',
      totalQuantity: 5,
      availableCount: 5,
      location: 'ห้องแล็บ 1',
    },
  })

  const hotplate = await prisma.instrument.upsert({
    where: { id: 'inst-hotplate' },
    update: {},
    create: {
      id: 'inst-hotplate',
      name: 'เตาไฟฟ้าพร้อมเครื่องกวนสาร',
      category: 'ELECTRICAL',
      description: 'เตาให้ความร้อนพร้อมระบบกวนสารละลาย',
      totalQuantity: 3,
      availableCount: 3,
      location: 'ห้องแล็บ 2',
    },
  })

  const beaker = await prisma.instrument.upsert({
    where: { id: 'inst-beaker' },
    update: {},
    create: {
      id: 'inst-beaker',
      name: 'บีกเกอร์ 250 ml (ชุด 6 ใบ)',
      category: 'GLASSWARE',
      description: 'บีกเกอร์แก้วสำหรับใช้ในห้องปฏิบัติการ',
      totalQuantity: 20,
      availableCount: 20,
      location: 'ตู้เก็บอุปกรณ์ A',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  await prisma.booking.createMany({
    data: [
      {
        userId: student.id,
        instrumentId: microscope.id,
        date: tomorrow,
        timeSlot: 'P2',
        purpose: 'ศึกษาเซลล์พืช (การ์ดโครงงาน)',
        status: 'APPROVED',
        approvedById: teacher.id,
        approvedAt: new Date(),
      },
      {
        userId: teacher.id,
        instrumentId: balance.id,
        date: tomorrow,
        timeSlot: 'P3',
        purpose: 'ชั่งสารเคมีประกอบการเรียน ม.5',
        status: 'APPROVED',
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    ],
  })

  console.log('Seed complete.')
  console.log('')
  console.log('บัญชีตัวอย่าง (รหัสผ่านทั้งหมด: Password123!):')
  console.log('  admin@school.ac.th    -> ผู้ดูแลห้องแล็บ')
  console.log('  teacher@school.ac.th  -> ครู')
  console.log('  executive@school.ac.th-> ผู้บริหาร')
  console.log('  student@school.ac.th  -> นักเรียน')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
