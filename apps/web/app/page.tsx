import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import { getOptionalUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "SciLab Booking — ที่ที่ความรู้ของนักเรียนเบ่งบาน",
};

const FEATURES = [
  {
    emoji: "🧪",
    title: "จองเครื่องมือห้องแล็บ",
    desc: "เลือกวันและเวลาที่ต้องการ จองเครื่องมือวิทยาศาสตร์ได้ทั้งเว็บและมือถือ",
  },
  {
    emoji: "⏰",
    title: "แจ้งเตือนก่อนเริ่มจอง",
    desc: "รับ Push และอีเมลก่อนถึงเวลาการใช้งาน ตามที่นัดหมายไว้ล่วงหน้า",
  },
  {
    emoji: "📆",
    title: "ปฏิทินการใช้ห้องแล็บ",
    desc: "เห็นภาพรวมการจองรายเดือน รู้ว่าเครื่องมือไหนว่างบ้างแบบเรียลไทม์",
  },
  {
    emoji: "📊",
    title: "ติดตามผลงานนักเรียน",
    desc: "รวมรวมโครงงานดีเด่นและผลงานนักเรียนไว้ในที่เดียว ให้ความสำเร็จเปล่งประกาย",
  },
];

function ProjectCard({ project }: { project: NonNullable<Awaited<ReturnType<typeof getFeaturedProjects>>[number]> }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden">
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 text-5xl">
            🌱
          </div>
        )}
        {project.award && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
            🏆 {project.award}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
          {project.summary}
        </p>
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p className="font-medium text-emerald-700">👩‍🔬 {project.studentNames}</p>
          <p className="mt-1">
            {project.className && `ห้อง ${project.className}`}
            {project.teacherName && ` • ที่ปรึกษา: ${project.teacherName}`}
          </p>
        </div>
      </div>
    </article>
  );
}

async function getFeaturedProjects() {
  return db.project.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export default async function Home() {
  const [user, projects] = await Promise.all([getOptionalUser(), getFeaturedProjects()]);

  const headerCta = user ? (
    <Link
      href="/dashboard"
      className="rounded-full bg-white/95 px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white"
    >
      ไปที่แดชบอร์ด →
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur transition-all hover:bg-white/30"
      >
        เข้าสู่ระบบ
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-white/95 px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white"
      >
        สมัครสมาชิก
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-emerald-700">
          <span className="text-2xl">🔬</span> SciLab Booking
        </Link>
        <nav className="flex items-center gap-3">{headerCta}</nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-300 via-teal-300 to-sky-300" />
        <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />

        {/* floating decorations */}
        <div className="pointer-events-none absolute inset-0 hidden select-none text-4xl sm:block">
          <span className="animate-float absolute left-[8%] top-16">🌱</span>
          <span className="animate-float-slow absolute left-[18%] top-40">🧪</span>
          <span className="animate-float-slow absolute left-[42%] top-10">🌸</span>
          <span className="animate-float absolute left-[55%] top-32">💡</span>
          <span className="animate-float-slow absolute left-[70%] top-16">🌼</span>
          <span className="animate-float absolute left-[86%] top-36">📚</span>
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <span className="rounded-full bg-white/50 px-4 py-1.5 text-sm font-semibold text-emerald-800 backdrop-blur">
            🌈 ห้องแล็บวิทยาศาสตร์สำหรับทุกคน
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-6xl">
            ที่ที่ความรู้ของนักเรียน
            <span className="block bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
              “เบ่งบาน” อย่างงดงาม 🌸
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-emerald-50 sm:text-lg">
            จองเครื่องมือ เตรียมการทดลอง และอวดโฉมโครงงานดีเด่นของนักเรียน
            ให้ทุกการค้นพบเล็ก ๆ กลายเป็นความสำเร็จที่ยิ่งใหญ่
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#projects"
              className="rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-amber-950 shadow-lg shadow-amber-400/40 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
            >
              🌟 ชมโครงงานดีเด่น
            </a>
            {!user && (
              <Link
                href="/register"
                className="rounded-full bg-white/20 px-7 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur transition-all hover:bg-white/30"
              >
                เริ่มต้นใช้งานฟรี
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-2xl">
                {f.emoji}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pb-20">
        <div className="text-center">
          <span className="text-4xl">🏅</span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            โครงงานดีเด่นของนักเรียน
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            ผลงานสร้างสรรค์จากความอยากรู้อยากลองของนักเรียน
            เปล่งประกายผ่านการลงมือทำจริงในห้องปฏิบัติการ
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white/80 p-12 text-center ring-1 ring-slate-100">
            <span className="text-5xl">🌱</span>
            <p className="mt-4 font-medium text-slate-700">
              กำลังเตรียมแสดงผลงานโครงงานดีเด่น...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              รอติดตามผลงานสร้างสรรค์ของนักเรียนในเร็ว ๆ นี้
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm font-bold text-emerald-700">🔬 SciLab Booking</p>
          <p className="text-xs text-slate-500">
            ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์ · ให้ความรู้ของนักเรียนเบ่งบานทุกวัน 🌸
          </p>
        </div>
      </footer>
    </div>
  );
}
