import "server-only";
import { db } from "@scilab/db";

export interface ReportData {
  totalBookings: number;
  approvedCount: number;
  completedCount: number;
  cancelledCount: number;
  pendingCount: number;
  statusCounts: { status: string; count: number }[];
  topInstruments: { name: string; count: number }[];
  categoryUsage: { category: string; count: number }[];
  timeSlotUsage: { timeSlot: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  instrumentCount: number;
  activeInstruments: number;
}

export async function getReportData(): Promise<ReportData> {
  const [statusGroups, instrumentGroups, dailyGroups, instrumentCount, activeInstruments] =
    await Promise.all([
      db.booking.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.booking.groupBy({
        by: ["instrumentId"],
        _count: { _all: true },
        orderBy: { _count: { instrumentId: "desc" } },
        take: 10,
      }),
      db.booking.groupBy({
        by: ["date"],
        _count: { _all: true },
        where: { date: { gte: daysAgo(14) } },
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
    timeSlotUsage: await timeSlotUsage(),
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

async function timeSlotUsage() {
  const groups = await db.bookingSlot.groupBy({
    by: ["timeSlot"],
    _count: { _all: true },
    orderBy: { _count: { timeSlot: "desc" } },
  });

  return groups.map((g) => ({
    timeSlot: g.timeSlot,
    count: g._count._all,
  }));
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
  rows.push(["การใช้งานแยกตามช่วงเวลา (คาบเรียน)"]);
  rows.push(["คาบ", "จำนวนครั้ง"]);
  for (const t of data.timeSlotUsage) {
    rows.push([t.timeSlot, String(t.count)]);
  }

  return rows
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
