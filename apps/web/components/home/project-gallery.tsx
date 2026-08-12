"use client";

import { useMemo, useState } from "react";
import {
  AWARD_LEVEL_EMOJIS,
  AWARD_LEVEL_LABELS,
  AWARD_LEVEL_ORDER,
  type AwardLevel,
} from "@scilab/shared";
import ProjectCard, { type ProjectCardProject } from "@/components/home/project-card";

type AwardFilter = "all" | "awarded" | AwardLevel;

const AWARD_FILTERS: { value: AwardFilter; label: string }[] = [
  { value: "all", label: "ทุกโครงงาน" },
  { value: "awarded", label: "🏅 มีรางวัล" },
  ...AWARD_LEVEL_ORDER.map((level) => ({
    value: level as AwardFilter,
    label: `${AWARD_LEVEL_EMOJIS[level]} ${AWARD_LEVEL_LABELS[level]}`,
  })),
];

export default function ProjectGallery({
  projects,
  years,
}: {
  projects: ProjectCardProject[];
  years: number[];
}) {
  const [year, setYear] = useState<number | "all">("all");
  const [awardFilter, setAwardFilter] = useState<AwardFilter>("all");

  const yearCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of projects) counts.set(p.year, (counts.get(p.year) ?? 0) + 1);
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (year !== "all" && p.year !== year) return false;
      if (awardFilter === "all") return true;
      if (awardFilter === "awarded") return p.awards.length > 0;
      return p.awards.some((a) => a.level === awardFilter);
    });
  }, [projects, year, awardFilter]);

  const byYear = useMemo(() => {
    const grouped = new Map<number, ProjectCardProject[]>();
    for (const p of filtered) {
      const list = grouped.get(p.year) ?? [];
      list.push(p);
      grouped.set(p.year, list);
    }
    return grouped;
  }, [filtered]);

  const visibleYears = years.filter((y) => byYear.has(y));
  const totalCount = filtered.length;

  return (
    <div>
      <div className="mt-10 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              ปี
            </span>
            <button
              type="button"
              onClick={() => setYear("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                year === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  year === y
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {y}
                <span className={`ml-1 ${year === y ? "text-emerald-100" : "text-slate-400"}`}>
                  ({yearCounts.get(y) ?? 0})
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              รางวัล
            </span>
            {AWARD_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setAwardFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  awardFilter === f.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        แสดง {totalCount} โครงงาน
        {year !== "all" && ` ในปี ${year}`}
        {awardFilter !== "all" &&
          awardFilter !== "awarded" &&
          ` ที่ได้${AWARD_LEVEL_LABELS[awardFilter as AwardLevel]}`}
        {awardFilter === "awarded" && " ที่ได้รับรางวัล"}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white/80 p-10 text-center ring-1 ring-slate-100">
          <span className="text-4xl">🔍</span>
          <p className="mt-3 font-medium text-slate-700">ไม่พบโครงงานตามเงื่อนไข</p>
          <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนปีหรือระดับรางวัล</p>
        </div>
      ) : (
        <div className="mt-6 space-y-12">
          {visibleYears.map((y) => (
            <section key={y}>
              <h3 className="mb-5 flex items-center gap-2.5 text-xl font-bold text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                  {String(y).slice(2)}
                </span>
                โครงงานปี {y}
                <span className="text-sm font-normal text-slate-400">
                  ({byYear.get(y)?.length ?? 0} โครงงาน)
                </span>
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {byYear.get(y)?.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
