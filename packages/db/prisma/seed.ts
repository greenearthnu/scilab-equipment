import { $Enums, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = 'Password123!'

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.ac.th' },
    create: {
      email: 'admin@school.ac.th',
      passwordHash,
      name: 'ผู้ดูแลห้องปฏิบัติการ',
      role: 'LAB_ADMIN',
      studentId: 'AD-001',
      phone: '081-234-5678',
    },
    update: {
      studentId: 'AD-001',
      phone: '081-234-5678',
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.ac.th' },
    create: {
      email: 'teacher@school.ac.th',
      passwordHash,
      name: 'ครูวิทยาศาสตร์',
      role: 'TEACHER',
      studentId: 'TC-1001',
      phone: '082-345-6789',
    },
    update: {
      studentId: 'TC-1001',
      phone: '082-345-6789',
    },
  })

  const executive = await prisma.user.upsert({
    where: { email: 'executive@school.ac.th' },
    create: {
      email: 'executive@school.ac.th',
      passwordHash,
      name: 'รองผู้อำนวยการ',
      role: 'EXECUTIVE',
      studentId: 'EX-2024',
      phone: '083-456-7890',
    },
    update: {
      studentId: 'EX-2024',
      phone: '083-456-7890',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@school.ac.th' },
    create: {
      email: 'student@school.ac.th',
      passwordHash,
      name: 'นักเรียน ม.4/1',
      role: 'STUDENT',
      className: 'ม.4/1',
      studentId: 'S-66001',
      phone: '084-567-8901',
    },
    update: {
      className: 'ม.4/1',
      studentId: 'S-66001',
      phone: '084-567-8901',
    },
  })

  const microscope = await prisma.instrument.upsert({
    where: { id: 'inst-microscope' },
    update: {
      imageUrl: 'https://picsum.photos/seed/microscope/600/400',
    },
    create: {
      id: 'inst-microscope',
      name: 'กล้องจุลทรรศน์แบบใช้แสง',
      category: 'MICROSCOPE',
      description: 'กล้องจุลทรรศน์สำหรับศึกษาเซลล์ กำลังขยาย 40x-400x',
      imageUrl: 'https://picsum.photos/seed/microscope/600/400',
      totalQuantity: 10,
      availableCount: 10,
      location: 'ห้องแล็บ 1',
    },
  })

  const balance = await prisma.instrument.upsert({
    where: { id: 'inst-balance' },
    update: {
      imageUrl: 'https://picsum.photos/seed/balance/600/400',
    },
    create: {
      id: 'inst-balance',
      name: 'เครื่องชั่งไฟฟ้าสองตำแหน่ง',
      category: 'MEASURING',
      description: 'เครื่องชั่งดิจิทัลความละเอียด 0.01 กรัม',
      imageUrl: 'https://picsum.photos/seed/balance/600/400',
      totalQuantity: 5,
      availableCount: 5,
      location: 'ห้องแล็บ 1',
    },
  })

  const hotplate = await prisma.instrument.upsert({
    where: { id: 'inst-hotplate' },
    update: {
      imageUrl: 'https://picsum.photos/seed/hotplate/600/400',
    },
    create: {
      id: 'inst-hotplate',
      name: 'เตาไฟฟ้าพร้อมเครื่องกวนสาร',
      category: 'ELECTRICAL',
      description: 'เตาให้ความร้อนพร้อมระบบกวนสารละลาย',
      imageUrl: 'https://picsum.photos/seed/hotplate/600/400',
      totalQuantity: 3,
      availableCount: 3,
      location: 'ห้องแล็บ 2',
    },
  })

  const beaker = await prisma.instrument.upsert({
    where: { id: 'inst-beaker' },
    update: {
      imageUrl: 'https://picsum.photos/seed/beaker/600/400',
    },
    create: {
      id: 'inst-beaker',
      name: 'บีกเกอร์ 250 ml (ชุด 6 ใบ)',
      category: 'GLASSWARE',
      description: 'บีกเกอร์แก้วสำหรับใช้ในห้องปฏิบัติการ',
      imageUrl: 'https://picsum.photos/seed/beaker/600/400',
      totalQuantity: 20,
      availableCount: 20,
      location: 'ตู้เก็บอุปกรณ์ A',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const tomorrowUtc = new Date(`${tomorrowStr}T00:00:00.000Z`)

  await prisma.booking.deleteMany({
    where: { OR: [{ instrumentId: microscope.id }, { instrumentId: balance.id }] },
  })

  await prisma.booking.create({
    data: {
      userId: student.id,
      instrumentId: microscope.id,
      date: tomorrowUtc,
      startTime: '08:00',
      endTime: '09:40',
      purpose: 'ศึกษาเซลล์พืช (การ์ดโครงงาน)',
      status: 'APPROVED',
      approvedById: teacher.id,
      approvedAt: new Date(),
    },
  })

  await prisma.booking.create({
    data: {
      userId: teacher.id,
      instrumentId: balance.id,
      date: tomorrowUtc,
      startTime: '09:50',
      endTime: '11:30',
      purpose: 'ชั่งสารเคมีประกอบการเรียน ม.5',
      status: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date(),
    },
  })

  const projects = [
    {
      title: 'การผลิตปุ๋ยชีวภาพจากเปลือกกล้วย',
      summary:
        'ศึกษาและพัฒนาสูตรปุ๋ยชีวภาพจากเปลือกกล้วยร่วมกับจุลินทรีย์ในดิน เพื่อลดขยะอินทรีย์ในโรงเรียนและเพิ่มธาตุอาหารให้พืชทดลอง',
      studentNames: 'น.ส.ปุณยวีร์ แสงทอง, น.ส.พิมพ์ชนก นาคบุตร',
      className: 'ม.5/1',
      teacherName: 'ครูวิทยาศาสตร์',
      year: 2026,
      featured: true,
      displayOrder: 1,
      images: [
        'https://picsum.photos/seed/project-fertilizer/1200/600',
        'https://picsum.photos/seed/project-fertilizer-2/1200/600',
        'https://picsum.photos/seed/project-fertilizer-3/1200/600',
      ],
      awards: [
        { title: 'รางวัลชนะเลิศ งานสัปดาห์วิทยาศาสตร์', level: 'GOLD' },
        { title: 'เหรียญทองเวทีโครงงานเยาวชนระดับชาติ', level: 'GOLD' },
      ],
    },
    {
      title: 'ระบบรดน้ำอัตโนมัติอัจฉริยะด้วยเซนเซอร์ความชื้นในดิน',
      summary:
        'สร้างระบบรดน้ำต้นไม้อัตโนมัติที่อ่านค่าความชื้นดินผ่านเซนเซอร์ แล้วสั่งจ่ายน้ำผ่านไมโครคอนโทรลเลอร์ ช่วยประหยัดน้ำและดูแลสวนโรงเรียน',
      studentNames: 'นายธนกฤต วัฒนา, นายกรวิชญ์ ศรีวิชัย, น.ส.วริศรา กาญจนา',
      className: 'ม.6/2',
      teacherName: 'ครูวิทยาศาสตร์',
      year: 2026,
      featured: true,
      displayOrder: 2,
      images: [
        'https://picsum.photos/seed/project-watering/1200/600',
        'https://picsum.photos/seed/project-watering-2/1200/600',
      ],
      awards: [
        { title: 'รองชนะเลิศอันดับ 1 ระดับจังหวัด', level: 'SILVER' },
        { title: 'รางวัลนวัตกรรมดีเด่นด้านเทคโนโลยี', level: 'HONORABLE' },
      ],
    },
    {
      title: 'น้ำยาล้างจานธรรมชาติจากสมุนไพรไทย',
      summary:
        'พัฒนาสูตรน้ำยาล้างจานที่ปลอดภัยจากสารสกัดสมุนไพรไทย เปรียบเทียบประสิทธิภาพการกำจัดคราบไขมันกับน้ำยาทั่วไป พร้อมทดสอบการย่อยสลาย',
      studentNames: 'น.ส.อรจิรา พวงมาลัย, น.ส.ชุติกาญจน์ ภิญโญ',
      className: 'ม.4/3',
      teacherName: 'ครูวิทยาศาสตร์',
      year: 2025,
      featured: true,
      displayOrder: 3,
      images: [
        'https://picsum.photos/seed/project-dishsoap/1200/600',
      ],
      awards: [
        { title: 'รางวัลชมเชย งานประดิษฐ์เชิงวิทยาศาสตร์', level: 'HONORABLE' },
      ],
    },
    {
      title: 'การศึกษาพลังงานสะอาดจากผลไม้ไทย',
      summary:
        'ทดลองสร้างแบตเตอรี่ไฟฟ้าจากผลไม้ไทยหลากชนิด เปรียบเทียบแรงเคลื่อนไฟฟ้าและความสว่างของหลอดไฟ เพื่อหาวัตถุดิบที่ให้พลังงานสูงสุด',
      studentNames: 'นายศุภกร จันทร์เพ็ญ, น.ส.กชกร ทรัพย์เจริญ',
      className: 'ม.4/1',
      teacherName: 'ครูฟิสิกส์',
      year: 2025,
      featured: false,
      displayOrder: 4,
      images: [
        'https://picsum.photos/seed/project-fruit/1200/600',
        'https://picsum.photos/seed/project-fruit-2/1200/600',
      ],
      awards: [
        { title: 'รางวัล Popular Vote งาน Open House', level: 'OTHER' },
      ],
    },
  ]

  for (const p of projects) {
    const { awards, images, ...project } = p
    await prisma.project.upsert({
      where: { id: `project-${p.title}` },
      update: project,
      create: {
        id: `project-${p.title}`,
        ...project,
        createdById: admin.id,
      },
    })
    await prisma.projectImage.deleteMany({ where: { projectId: `project-${p.title}` } })
    await prisma.projectImage.createMany({
      data: images.map((url, index) => ({
        url,
        displayOrder: index,
        projectId: `project-${p.title}`,
      })),
    })
    await prisma.projectAward.deleteMany({ where: { projectId: `project-${p.title}` } })
    await prisma.projectAward.createMany({
      data: awards.map((a) => ({
        title: a.title,
        level: a.level as $Enums.AwardLevel,
        year: project.year,
        projectId: `project-${p.title}`,
      })),
    })
  }

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
