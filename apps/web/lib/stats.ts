import "server-only";
import { db } from "@scilab/db";
import { csvCell } from "@/lib/csv";

export interface ReportData {
  totalBookings: number;
  approvedCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  statusCounts: { status: string; count: number }[];
  topInstruments: { name: string; count: number }[];
  categoryUsage: { category: string; count: number }[];
  timeSlotUsage: { time: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  instrumentCount: number;
  activeInstruments: number;
}

export async function getReportData(
  from?: Date | null,
  to?: Date | null
): Promise<ReportData> {
  const dateWhere =
    from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: new Date(to.getTime() + 86400000 - 1) } : {}),
          },
        }
      : undefined;

  const [statusGroups, instrumentGroups, dailyGroups, instrumentCount, activeInstruments] =
    await Promise.all([
      db.booking.groupBy({
        by: ["status"],
        _count: { _all: true },
        ...(dateWhere ? { where: dateWhere } : {}),
      }),
      db.booking.groupBy({
        by: ["instrumentId"],
        _count: { _all: true },
        orderBy: { _count: { instrumentId: "desc" } },
        take: 10,
        ...(dateWhere ? { where: dateWhere } : {}),
      }),
      db.booking.groupBy({
        by: ["date"],
        _count: { _all: true },
        where: dateWhere ?? { date: { gte: daysAgo(14) } },
      }),
      db.instrument.count(),
      db.instrument.count({ where: { status: "AVAILABLE" } }),
    ]);

  const instrumentNames = await db.instrument.findMany({
    where: { id: { in: instrumentGroups.map((g) => g.instrumentId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(instrumentNames.map((i) => [i.id, i.name]));

  const statusCounts = statusGroups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));

  const topInstruments = instrumentGroups.map((g) => ({
    name: nameById.get(g.instrumentId) ?? "ไม่ทราบชื่อ",
    count: g._count._all,
  }));

  const totalBookings = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const countFor = (status: string) =>
    statusCounts.find((s) => s.status === status)?.count ?? 0;

  const dailyMap = new Map<string, number>();
  for (const g of dailyGroups) {
    dailyMap.set(g.date.toISOString().slice(0, 10), g._count._all);
  }
  const dailyTrend = lastNDays(14).map((dateStr) => ({
    date: dateStr,
    count: dailyMap.get(dateStr) ?? 0,
  }));

  const categoryUsage = await categoryUsageFromBookings(instrumentGroups);

  return {
    totalBookings,
    approvedCount: countFor("APPROVED"),
    completedCount: countFor("COMPLETED"),
    cancelledCount: countFor("CANCELLED"),
    pendingCount: countFor("PENDING"),
    statusCounts,
    topInstruments,
    categoryUsage,
    timeSlotUsage: await timeSlotUsage(dateWhere),
    dailyTrend,
    instrumentCount,
    activeInstruments,
  };
}

async function categoryUsageFromBookings(
  instrumentGroups: { instrumentId: string; _count: { _all: number } }[]
) {
  if (instrumentGroups.length === 0) return [];

  const instruments = await db.instrument.findMany({
    where: { id: { in: instrumentGroups.map((g) => g.instrumentId) } },
    select: { id: true, category: true },
  });
  const categoryById = new Map(instruments.map((i) => [i.id, i.category]));

  const byCategory = new Map<string, number>();
  for (const g of instrumentGroups) {
    const cat = categoryById.get(g.instrumentId) ?? "OTHER";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + g._count._all);
  }

  return Array.from(byCategory.entries()).map(([category, count]) => ({
    category,
    count,
  }));
}

async function timeSlotUsage(dateWhere?: { date: { gte?: Date; lte?: Date } }) {
  const bookings = await db.booking.findMany({
    where: {
      ...(dateWhere ? dateWhere : {}),
      status: { not: "CANCELLED" },
    },
    select: { startTime: true },
  });

  const byHour = new Map<string, number>();
  for (const b of bookings) {
    const hour = b.startTime.slice(0, 2) + ":00";
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
  }

  return Array.from(byHour.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function reportToCsv(data: ReportData): string {
  const rows: string[][] = [];

  rows.push(["สรุปการใช้งานห้องปฏิบัติการวิทยาศาสตร์"]);
  rows.push(["วันที่ออกรายงาน", new Date().toLocaleString("th-TH")]);
  rows.push([]);
  rows.push(["ตัวชี้วัด", "ค่า"]);
  rows.push(["จำนวนการจองทั้งหมด", String(data.totalBookings)]);
  rows.push(["การจองที่อนุมัติ", String(data.approvedCount)]);
  rows.push(["การจองที่เสร็จสิ้น", String(data.completedCount)]);
  rows.push(["การจองที่ยกเลิก", String(data.cancelledCount)]);
  rows.push(["จำนวนเครื่องมือทั้งหมด", String(data.instrumentCount)]);
  rows.push(["เครื่องมือพร้อมใช้งาน", String(data.activeInstruments)]);
  rows.push([]);
  rows.push(["เครื่องมือที่ถูกจองมากที่สุด 10 อันดับ"]);
  rows.push(["ชื่อเครื่องมือ", "จำนวนครั้ง"]);
  for (const i of data.topInstruments) {
    rows.push([i.name, String(i.count)]);
  }
  rows.push([]);
  rows.push(["การใช้งานแยกตามหมวดหมู่"]);
  rows.push(["หมวดหมู่", "จำนวนครั้ง"]);
  for (const c of data.categoryUsage) {
    rows.push([c.category, String(c.count)]);
  }
  rows.push([]);
  rows.push(["การใช้งานแยกตามช่วงเวลา (ชั่วโมงเริ่มใช้งาน)"]);
  rows.push(["เวลา", "จำนวนครั้ง"]);
  for (const t of data.timeSlotUsage) {
    rows.push([t.time, String(t.count)]);
  }

  return rows
    .map((r) => r.map((cell) => csvCell(cell)).join(","))
    .join("\n");
}
