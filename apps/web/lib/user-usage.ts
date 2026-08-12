import "server-only";
import { db } from "@scilab/db";
import type { BookingStatus } from "@scilab/shared";

export interface UserUsageSummary {
  totalBookings: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  checkedOutCount: number;
  completedCount: number;
  reservedHours: number;
  usedMinutes: number;
  sessionCount: number;
  instrumentCount: number;
  firstBookingAt: string | null;
  lastBookingAt: string | null;
}

export interface UserUsageData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    className: string | null;
    studentId: string | null;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
  };
  summary: UserUsageSummary;
  statusCounts: { status: string; count: number }[];
  topInstruments: { name: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  recentBookings: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    purpose: string | null;
    instrument: { name: string };
  }[];
}

function minutesFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function last6Months(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function getUserUsage(userId: string): Promise<UserUsageData | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      className: true,
      studentId: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  if (!user) return null;

  const [bookings, usageLogs, statusGroups, instrumentGroups, monthlyGroups] =
    await Promise.all([
      db.booking.findMany({
        where: { userId },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          status: true,
          purpose: true,
          instrument: { select: { name: true } },
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        take: 200,
      }),
      db.usageLog.findMany({
        where: { userId, checkedOutAt: { not: null } },
        select: { checkedInAt: true, checkedOutAt: true },
      }),
      db.booking.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
      db.booking.groupBy({
        by: ["instrumentId"],
        where: { userId, status: { not: "CANCELLED" } },
        _count: { _all: true },
        orderBy: { _count: { instrumentId: "desc" } },
        take: 8,
      }),
      db.booking.groupBy({
        by: ["date"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

  const nameById = new Map<string, string>();
  if (instrumentGroups.length > 0) {
    const instruments = await db.instrument.findMany({
      where: { id: { in: instrumentGroups.map((g) => g.instrumentId) } },
      select: { id: true, name: true },
    });
    for (const i of instruments) nameById.set(i.id, i.name);
  }

  const countFor = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  // ชั่วโมงที่จองทั้งหมด: เฉพาะการจองที่ใช้งานจริง (อนุมัติ/กำลังใช้/เสร็จสิ้น)
  const usableStatuses = new Set(["APPROVED", "CHECKED_OUT", "COMPLETED"]);
  const reservedMinutes = bookings
    .filter((b) => usableStatuses.has(b.status))
    .reduce(
      (sum, b) => sum + Math.max(0, minutesFromTime(b.endTime) - minutesFromTime(b.startTime)),
      0
    );

  const usedMinutes = usageLogs.reduce((sum, log) => {
    if (!log.checkedOutAt) return sum;
    const ms = log.checkedOutAt.getTime() - log.checkedInAt.getTime();
    return sum + Math.max(0, Math.round(ms / 60000));
  }, 0);

  const monthlyMap = new Map<string, number>();
  for (const g of monthlyGroups) {
    monthlyMap.set(monthKey(g.date), g._count._all);
  }
  const monthlyTrend = last6Months().map((m) => ({
    month: m,
    count: monthlyMap.get(m) ?? 0,
  }));

  const dates = bookings.map((b) => b.date.getTime());
  const firstBookingAt = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null;
  const lastBookingAt = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  return {
    user,
    summary: {
      totalBookings: bookings.length,
      pendingCount: countFor("PENDING"),
      approvedCount: countFor("APPROVED"),
      rejectedCount: countFor("REJECTED"),
      cancelledCount: countFor("CANCELLED"),
      checkedOutCount: countFor("CHECKED_OUT"),
      completedCount: countFor("COMPLETED"),
      reservedHours: Math.round((reservedMinutes / 60) * 10) / 10,
      usedMinutes,
      sessionCount: usageLogs.length,
      instrumentCount: instrumentGroups.length,
      firstBookingAt,
      lastBookingAt,
    },
    statusCounts: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    topInstruments: instrumentGroups.map((g) => ({
      name: nameById.get(g.instrumentId) ?? "ไม่ทราบชื่อ",
      count: g._count._all,
    })),
    monthlyTrend,
    recentBookings: bookings.slice(0, 15),
  };
}
