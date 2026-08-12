import {
  AWARD_LEVEL_BADGES,
  AWARD_LEVEL_EMOJIS,
  type AwardLevel,
} from "@scilab/shared";

export function AwardBadge({
  title,
  level,
  className = "",
}: {
  title: string;
  level: AwardLevel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${AWARD_LEVEL_BADGES[level]} ${className}`}
    >
      <span aria-hidden>{AWARD_LEVEL_EMOJIS[level]}</span>
      {title}
    </span>
  );
}
