import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@scilab/db";
import { isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "ประวัติการจัดการ",
};

const ACTION_LABELS: Record<string, string> = {
  ROLE_CHANGE: "เปลี่ยนบทบาท",
  DEACTIVATE_USER: "ระงับบัญชี",
  ACTIVATE_USER: "เปิดใช้งานบัญชี",
  RESET_PASSWORD: "ตั้งรหัสผ่านใหม่",
  DELETE_USER: "ลบผู้ใช้",
};

type Entry = {
  id: string;
  createdAt: Date;
  kind: "audit" | "score";
  actorName: string | null;
  actionLabel: string;
  targetLabel: string;
  detail: string | null;
  change: number | null;
};

export default async function AuditPage() {
  const currentUser = await getCurrentUser();
  if (!isAdminRole(currentUser.role)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  const [auditLogs, scoreLogs] = await Promise.all([
    db.auditLog.findMany({
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.scoreLog.findMany({
      include: {
        user: { select: { name: true } },
        performedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const entries: Entry[] = [
    ...auditLogs.map<Entry>((log) => ({
      id: `a-${log.id}`,
      createdAt: log.createdAt,
      kind: "audit" as const,
      actorName: log.actor?.name ?? null,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      targetLabel: log.targetType === "User" ? "ผู้ใช้" : log.targetType,
      detail: log.details,
      change: null,
    })),
    ...scoreLogs.map<Entry>((log) => ({
      id: `s-${log.id}`,
      createdAt: log.createdAt,
      kind: "score" as const,
      actorName: log.performedBy?.name ?? null,
      actionLabel: SCORE_SOURCE_LABELS[log.source] ?? log.source,
      targetLabel: log.user?.name ?? "ผู้ใช้",
      detail: log.reason,
      change: log.change,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ประวัติการจัดการ</h1>
          <p className="mt-1 text-slate-600">
            บันทึกการกระทำสำคัญของผู้ดูแลระบบ (ย้อนหลัง 50 รายการล่าสุด)
          </p>
        </div>
        <Link
          href="/users"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          ← กลับไปจัดการผู้ใช้
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        {entries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            ยังไม่มีประวัติการจัดการ
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-3"
              >
                {e.kind === "score" ? (
                  <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-md px-2 py-1 text-xs font-bold tabular-nums ${
                      (e.change ?? 0) >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {(e.change ?? 0) >= 0 ? `+${e.change}` : e.change}
                  </span>
                ) : (
                  <span className="inline-flex w-fit shrink-0 items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {e.actionLabel}
                  </span>
                )}
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    {e.detail ?? e.actionLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.actionLabel}
                    {e.kind === "score" ? ` • ${e.targetLabel}` : ""}
                    {e.actorName ? ` • โดย ${e.actorName}` : " • ระบบอัตโนมัติ"} •{" "}
                    {e.createdAt.toLocaleDateString("th-TH")}{" "}
                    {e.createdAt.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-400">
        ข้อมูลแสดงตามเวลาจริง (แก้ไข/ลบ/ปรับคะแนน/ปลดล็อก) — ปรับคะแนนและปลดล็อกมาจาก
        ประวัติคะแนน (ScoreLog)
      </p>
    </div>
  );
}

const SCORE_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "ปรับคะแนน",
  EARLY_RETURN: "ได้คะแนนคืนเครื่องตรงเวลา",
  EVIDENCE: "ได้คะแนนอัปโหลดรูปหลักฐาน",
  UNLOCK: "ปลดล็อกการจอง",
};
