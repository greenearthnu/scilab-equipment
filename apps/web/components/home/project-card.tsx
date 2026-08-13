import Link from "next/link";
import {
  AWARD_LEVEL_ORDER,
  type AwardLevel,
} from "@scilab/shared";
import { AwardBadge } from "@/components/projects/award-badge";

export type ProjectCardProject = {
  id: string;
  title: string;
  summary: string;
  studentNames: string;
  className: string | null;
  teacherName: string | null;
  year: number;
  featured: boolean;
  images: { id: string; url: string }[];
  awards: { id: string; title: string; level: AwardLevel }[];
};

export default function ProjectCard({ project }: { project: ProjectCardProject }) {
  const awards = [...project.awards].sort(
    (a, b) => AWARD_LEVEL_ORDER.indexOf(a.level) - AWARD_LEVEL_ORDER.indexOf(b.level)
  );
  const cover = project.images[0]?.url;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-44 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 text-5xl">
            🌱
          </div>
        )}
        {project.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
            ★ ดีเด่น
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
          ปี {project.year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {project.summary}
        </p>
        {awards.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {awards.map((a) => (
              <AwardBadge key={a.id} title={a.title} level={a.level} />
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p className="font-medium text-emerald-700">👩‍🔬 {project.studentNames}</p>
          <p className="mt-1">
            {project.className && `ห้อง ${project.className}`}
            {project.teacherName && ` • ที่ปรึกษา: ${project.teacherName}`}
          </p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
          อ่านรายละเอียดเพิ่มเติม →
        </span>
      </div>
    </Link>
  );
}
