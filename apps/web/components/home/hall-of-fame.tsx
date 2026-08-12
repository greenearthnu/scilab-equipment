import { AWARD_LEVELS, type AwardLevel } from "@scilab/shared";

type HallProject = {
  awards: { level: AwardLevel }[];
};

function StatCard({
  emoji,
  label,
  value,
  accent,
}: {
  emoji: string;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm ring-1 ring-slate-100 backdrop-blur sm:p-5">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-xl ${accent}`}>
        {emoji}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

export default function HallOfFame({ projects }: { projects: HallProject[] }) {
  if (projects.length === 0) return null;

  const totalAwards = projects.reduce((sum, p) => sum + p.awards.length, 0);
  const levelCounts: Record<AwardLevel, number> = {
    [AWARD_LEVELS.GOLD]: 0,
    [AWARD_LEVELS.SILVER]: 0,
    [AWARD_LEVELS.BRONZE]: 0,
    [AWARD_LEVELS.HONORABLE]: 0,
    [AWARD_LEVELS.OTHER]: 0,
  };
  for (const p of projects) {
    for (const a of p.awards) levelCounts[a.level] += 1;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-4">
      <div className="text-center">
        <span className="text-4xl">🏅</span>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          หอเกียรติยศโครงงานและรางวัล
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
          ความสำเร็จของนักเรียนทุกยุค ถูกเก็บสะสมไว้ที่นี่ เปล่งประกายไปด้วยกัน
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard emoji="📚" label="โครงงานรวม" value={projects.length} accent="bg-emerald-100" />
        <StatCard emoji="🏆" label="รางวัลรวม" value={totalAwards} accent="bg-amber-100" />
        <StatCard
          emoji="🥇"
          label="เหรียญทอง"
          value={levelCounts[AWARD_LEVELS.GOLD]}
          accent="bg-amber-100"
        />
        <StatCard
          emoji="🥈"
          label="เหรียญเงิน"
          value={levelCounts[AWARD_LEVELS.SILVER]}
          accent="bg-slate-100"
        />
        <StatCard
          emoji="🥉"
          label="เหรียญทองแดง"
          value={levelCounts[AWARD_LEVELS.BRONZE]}
          accent="bg-orange-100"
        />
        <StatCard
          emoji="🎖️"
          label="ชมเชย/พิเศษ"
          value={
            levelCounts[AWARD_LEVELS.HONORABLE] + levelCounts[AWARD_LEVELS.OTHER]
          }
          accent="bg-sky-100"
        />
      </div>
    </section>
  );
}
