export const AWARD_LEVELS = {
  GOLD: 'GOLD',
  SILVER: 'SILVER',
  BRONZE: 'BRONZE',
  HONORABLE: 'HONORABLE',
  OTHER: 'OTHER',
} as const

export type AwardLevel = (typeof AWARD_LEVELS)[keyof typeof AWARD_LEVELS]

export const AWARD_LEVEL_LABELS: Record<AwardLevel, string> = {
  [AWARD_LEVELS.GOLD]: 'เหรียญทอง',
  [AWARD_LEVELS.SILVER]: 'เหรียญเงิน',
  [AWARD_LEVELS.BRONZE]: 'เหรียญทองแดง',
  [AWARD_LEVELS.HONORABLE]: 'ชมเชย',
  [AWARD_LEVELS.OTHER]: 'รางวัลพิเศษ',
}

export const AWARD_LEVEL_EMOJIS: Record<AwardLevel, string> = {
  [AWARD_LEVELS.GOLD]: '🏆',
  [AWARD_LEVELS.SILVER]: '🥈',
  [AWARD_LEVELS.BRONZE]: '🥉',
  [AWARD_LEVELS.HONORABLE]: '🎖️',
  [AWARD_LEVELS.OTHER]: '⭐',
}

export const AWARD_LEVEL_BADGES: Record<AwardLevel, string> = {
  [AWARD_LEVELS.GOLD]: 'bg-amber-400/95 text-amber-950',
  [AWARD_LEVELS.SILVER]: 'bg-slate-300/95 text-slate-900',
  [AWARD_LEVELS.BRONZE]: 'bg-orange-400/95 text-orange-950',
  [AWARD_LEVELS.HONORABLE]: 'bg-sky-400/95 text-sky-950',
  [AWARD_LEVELS.OTHER]: 'bg-emerald-400/95 text-emerald-950',
}

export const AWARD_LEVEL_CHIPS: Record<AwardLevel, string> = {
  [AWARD_LEVELS.GOLD]: 'border-amber-200 bg-amber-50 text-amber-800',
  [AWARD_LEVELS.SILVER]: 'border-slate-200 bg-slate-100 text-slate-700',
  [AWARD_LEVELS.BRONZE]: 'border-orange-200 bg-orange-50 text-orange-800',
  [AWARD_LEVELS.HONORABLE]: 'border-sky-200 bg-sky-50 text-sky-800',
  [AWARD_LEVELS.OTHER]: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

export const AWARD_LEVEL_ORDER: AwardLevel[] = [
  AWARD_LEVELS.GOLD,
  AWARD_LEVELS.SILVER,
  AWARD_LEVELS.BRONZE,
  AWARD_LEVELS.HONORABLE,
  AWARD_LEVELS.OTHER,
]

export function isAwardLevel(value: unknown): value is AwardLevel {
  return (
    typeof value === 'string' &&
    Object.values(AWARD_LEVELS).includes(value as AwardLevel)
  )
}
