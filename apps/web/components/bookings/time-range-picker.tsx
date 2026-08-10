"use client";

import { rangesOverlap, type TimeRange } from "@scilab/shared";

const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 19 * 60;
const STEP_MIN = 30;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function buildBlocks(): string[] {
  const blocks: string[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += STEP_MIN) {
    blocks.push(toTime(m));
  }
  return blocks;
}

function blockRange(start: string): TimeRange {
  return { startTime: start, endTime: toTime(toMinutes(start) + STEP_MIN) };
}

interface TimeRangePickerProps {
  takenRanges: TimeRange[];
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
}

export default function TimeRangePicker({
  takenRanges,
  startTime,
  endTime,
  onChange,
}: TimeRangePickerProps) {
  const blocks = buildBlocks();

  const isTaken = (block: string) =>
    takenRanges.some((r) => rangesOverlap(r, blockRange(block)));

  const selStart = startTime && endTime
    ? startTime < endTime ? startTime : endTime
    : null;
  const selEnd = startTime && endTime
    ? startTime < endTime ? endTime : startTime
    : null;

  const isSelected = (block: string) => {
    if (!selStart || !selEnd) return false;
    const b = toMinutes(block);
    return b >= toMinutes(selStart) && b < toMinutes(selEnd);
  };

  const handleClick = (block: string) => {
    if (isTaken(block)) return;
    if (!startTime || (startTime && endTime)) {
      onChange(block, "");
      return;
    }
    if (block <= startTime) {
      onChange(block, "");
      return;
    }
    onChange(startTime, block);
  };

  const selectedRange: TimeRange | null =
    selStart && selEnd ? { startTime: selStart, endTime: selEnd } : null;
  const selectedConflicts = selectedRange
    ? takenRanges.filter((r) => rangesOverlap(r, selectedRange))
    : [];

  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {blocks.map((block) => {
          const taken = isTaken(block);
          const selected = isSelected(block);
          const inConflict = selected && selectedConflicts.length > 0;
          const isStart = block === startTime;
          const isEnd = block === endTime;

          return (
            <button
              key={block}
              type="button"
              onClick={() => handleClick(block)}
              disabled={taken}
              className={`rounded-md border px-1 py-1.5 text-center text-[11px] font-medium transition-colors ${
                taken
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                  : inConflict
                    ? "border-red-400 bg-red-50 text-red-600"
                    : selected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
              } ${isStart || isEnd ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
            >
              {block}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
          ถูกจองแล้ว
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-emerald-600 bg-emerald-600" />
          ช่วงที่เลือก
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm border border-amber-400 bg-white" />
          จุดเริ่ม/สิ้นสุด
        </span>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        แตะเวลาเริ่มก่อน แล้วแตะเวลาสิ้นสุดเพื่อเลือกช่วง (ครั้งละ 30 นาที)
      </p>

      {selectedConflicts.length > 0 && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          ช่วงเวลาที่เลือกทับซ้อนกับการจอง{" "}
          {selectedConflicts.map((r) => `${r.startTime}-${r.endTime}`).join(", ")}{" "}
          กรุณาเลือกช่วงอื่น
        </p>
      )}
    </div>
  );
}
