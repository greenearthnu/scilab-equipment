import type { Metadata } from "next";
import { db } from "@scilab/db";
import CalendarView from "@/components/calendar/calendar-view";

export const metadata: Metadata = {
  title: "ปฏิทินการจอง",
};

export default async function CalendarPage() {
  const instruments = await db.instrument.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ปฏิทินการจอง</h1>
        <p className="mt-1 text-sm text-slate-600">
          ดูภาพรวมการจองเครื่องมือรายวัน คลิกวันที่เพื่อดูรายละเอียด
        </p>
      </div>
      <CalendarView instruments={instruments} />
    </div>
  );
}
