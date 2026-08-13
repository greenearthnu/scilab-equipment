import type { Metadata } from "next";
import Link from "next/link";
import { isAdminRole } from "@scilab/shared";
import { db } from "@scilab/db";
import { getCurrentUser } from "@/lib/dal";
import {
  setProjectPublished,
  setProjectFeatured,
  deleteProject,
} from "@/lib/actions/projects";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import { AwardBadge } from "@/components/projects/award-badge";

export const metadata: Metadata = {
  title: "จัดการโครงงาน",
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  if (!isAdminRole(user.role)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  const projects = await db.project.findMany({
    include: {
      awards: { orderBy: [{ level: "asc" }, { createdAt: "asc" }] },
      images: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: [{ year: "desc" }, { featured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });

  const byYear = new Map<number, typeof projects>();
  for (const p of projects) {
    const list = byYear.get(p.year) ?? [];
    list.push(p);
    byYear.set(p.year, list);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการโครงงานดีเด่น</h1>
          <p className="mt-1 text-sm text-slate-600">
            เพิ่มและควบคุมโครงงานที่จะแสดงบนหน้าแรก
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          + เพิ่มโครงงาน
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          ยังไม่มีโครงงานในระบบ
        </p>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                  {String(year).slice(2)}
                </span>
                ปี {year}
                <span className="text-sm font-normal text-slate-400">
                  ({byYear.get(year)?.length ?? 0} โครงงาน)
                </span>
              </h2>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {byYear.get(year)?.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      {p.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].url}
                          alt={p.title}
                          className="h-14 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-emerald-50 text-xl">
                          🌱
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {p.title}
                          {p.featured && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              ★ ดีเด่น
                            </span>
                          )}
                          {!p.published && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              ซ่อน
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {p.studentNames}
                          {p.className ? ` • ${p.className}` : ""}
                        </p>
                        {p.awards.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {p.awards.map((a) => (
                              <AwardBadge key={a.id} title={a.title} level={a.level} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/projects/${p.id}/edit`}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        แก้ไข
                      </Link>
                      <form action={setProjectFeatured}>
                        <input type="hidden" name="projectId" value={p.id} />
                        <button
                          type="submit"
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            p.featured
                              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p.featured ? "เลิกเน้น" : "เน้นหน้าแรก"}
                        </button>
                      </form>
                      <form action={setProjectPublished}>
                        <input type="hidden" name="projectId" value={p.id} />
                        <button
                          type="submit"
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            p.published
                              ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {p.published ? "ซ่อน" : "แสดง"}
                        </button>
                      </form>
                      <form action={deleteProject}>
                        <input type="hidden" name="projectId" value={p.id} />
                        <ConfirmSubmitButton
                          title="ลบโครงงาน"
                          message={`ลบโครงงาน "${p.title}"? ข้อมูลจะถูกลบถาวร`}
                          confirmLabel="ลบ"
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                        >
                          ลบ
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
