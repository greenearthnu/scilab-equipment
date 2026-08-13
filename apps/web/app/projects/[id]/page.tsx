import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AWARD_LEVEL_ORDER,
} from "@scilab/shared";
import { db } from "@scilab/db";
import { AwardBadge } from "@/components/projects/award-badge";

export const metadata: Metadata = {
  title: "รายละเอียดโครงงาน",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    // keep raw id if it is not valid percent-encoding
  }
  id = id.replace(/[\u0000-\u001f\u007f]/g, "");

  const project = await db.project.findUnique({
    where: { id },
    include: {
      awards: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!project || !project.published) {
    notFound();
  }

  const awards = [...project.awards].sort(
    (a, b) => AWARD_LEVEL_ORDER.indexOf(a.level) - AWARD_LEVEL_ORDER.indexOf(b.level)
  );
  const cover = project.images[0]?.url;
  const gallery = project.images.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-emerald-50">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-emerald-700">
          <span className="text-2xl">🔬</span> SciLab Booking
        </Link>
        <Link
          href="/"
          className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-all hover:bg-white"
        >
          ← กลับหน้าแรก
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-16">
        <article className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="relative">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={project.title}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-emerald-200 to-teal-200 text-6xl sm:h-80">
                🌱
              </div>
            )}
            {project.featured && (
              <span className="absolute left-4 top-4 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
                ★ ดีเด่น
              </span>
            )}
            <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              ปี {project.year}
            </span>
          </div>

          <div className="p-6 sm:p-10">
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {project.title}
            </h1>

            {awards.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {awards.map((a) => (
                  <AwardBadge key={a.id} title={a.title} level={a.level} />
                ))}
              </div>
            )}

            <p className="mt-6 leading-relaxed text-slate-700">
              {project.summary}
            </p>

            <div className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ผู้จัดทำ
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  👩‍🔬 {project.studentNames}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ชั้น
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {project.className || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ที่ปรึกษา
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {project.teacherName || "-"}
                </p>
              </div>
            </div>

            {gallery.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-slate-900">ภาพเพิ่มเติม</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt={project.title}
                      className="h-40 w-full rounded-xl object-cover ring-1 ring-slate-100"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
