import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import { getOptionalUser } from "@/lib/dal";
import ProjectSlider from "@/components/home/project-slider";
import ProjectGallery from "@/components/home/project-gallery";
import HallOfFame from "@/components/home/hall-of-fame";

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

async function getFeaturedProjects() {
  return db.project.findMany({
    where: { published: true },
    include: {
      awards: true,
      images: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: [{ featured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export default async function Home() {
  const [user, projects] = await Promise.all([getOptionalUser(), getFeaturedProjects()]);

  const featured = projects.filter((p) => p.featured);
  const years = Array.from(new Set(projects.map((p) => p.year))).sort((a, b) => b - a);

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

      {/* Featured slider */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 pt-8">
          <ProjectSlider projects={featured} />
        </section>
      ) : (
        <section className="mx-auto w-full max-w-6xl px-4 pt-8">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-200 via-teal-200 to-sky-200 px-6 py-16 text-center ring-1 ring-slate-100">
            <span className="text-5xl">🔬</span>
            <h1 className="mt-4 text-3xl font-extrabold text-emerald-900 sm:text-4xl">
              ยินดีต้อนรับสู่ SciLab Booking
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-emerald-800 sm:text-base">
              ระบบจองเครื่องมือห้องปฏิบัติการวิทยาศาสตร์ ให้ทุกการค้นพบเล็ก ๆ
              กลายเป็นความสำเร็จที่ยิ่งใหญ่
            </p>
          </div>
        </section>
      )}

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
          <>
            <HallOfFame projects={projects} />
            <ProjectGallery projects={projects} years={years} />
          </>
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
