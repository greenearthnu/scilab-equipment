"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AWARD_LEVEL_ORDER,
  type AwardLevel,
} from "@scilab/shared";

export type SliderProject = {
  id: string;
  title: string;
  summary: string;
  studentNames: string;
  year: number;
  images: { id: string; url: string }[];
  awards: { id: string; title: string; level: AwardLevel }[];
};

const AUTOPLAY_MS = 5000;

export default function ProjectSlider({ projects }: { projects: SliderProject[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = projects.length;

  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (count < 2) return;
    timer.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (count === 0) return null;

  const p = projects[index];
  const topAwards = [...p.awards]
    .sort((a, b) => AWARD_LEVEL_ORDER.indexOf(a.level) - AWARD_LEVEL_ORDER.indexOf(b.level))
    .slice(0, 2);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-100"
      onMouseEnter={() => timer.current && clearInterval(timer.current)}
      onMouseLeave={() => {
        if (count < 2) return;
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
          setIndex((prev) => (prev + 1) % count);
        }, AUTOPLAY_MS);
      }}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        {p.images[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.images[0].url}
            alt={p.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-300 via-teal-300 to-sky-300 text-7xl">
            🌱
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {topAwards.length > 0 && (
          <span className="absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
            {topAwards.map((a) => (
              <span
                key={a.id}
                className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                  a.level === "GOLD"
                    ? "bg-amber-400/95 text-amber-950"
                    : a.level === "SILVER"
                      ? "bg-slate-300/95 text-slate-900"
                      : a.level === "BRONZE"
                        ? "bg-orange-400/95 text-orange-950"
                        : a.level === "HONORABLE"
                          ? "bg-sky-400/95 text-sky-950"
                          : "bg-emerald-400/95 text-emerald-950"
                }`}
              >
                {a.title}
              </span>
            ))}
            {p.awards.length > topAwards.length && (
              <span className="rounded-full bg-white/25 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur">
                +{p.awards.length - topAwards.length}
              </span>
            )}
          </span>
        )}
        <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur">
          ปี {p.year}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <h3 className="text-xl font-extrabold text-white drop-shadow sm:text-3xl">
            {p.title}
          </h3>
          <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-emerald-50/90 sm:block">
            {p.summary}
          </p>
          <p className="mt-3 text-xs font-medium text-emerald-200 sm:text-sm">
            👩‍🔬 {p.studentNames}
          </p>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="ก่อนหน้า"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-inset ring-white/40 backdrop-blur transition-all hover:bg-white/40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="ถัดไป"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white ring-1 ring-inset ring-white/40 backdrop-blur transition-all hover:bg-white/40"
          >
            ›
          </button>
          <div className="absolute bottom-3 right-5 flex items-center gap-1.5">
            {projects.map((proj, i) => (
              <button
                key={proj.id}
                type="button"
                aria-label={`ดูสไลด์ ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-amber-400" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
