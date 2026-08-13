import type { Metadata } from "next";
import { db } from "@scilab/db";
import { getCurrentUser } from "@/lib/dal";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";

export const metadata: Metadata = {
  title: "การแจ้งเตือน",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การแจ้งเตือน</h1>
          <p className="mt-1 text-slate-600">
            ข้อความแจ้งเตือนทั้งหมดของคุณ
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                ยังไม่อ่าน {unreadCount} รายการ
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              อ่านทั้งหมด
            </button>
          </form>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        {notifications.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            ยังไม่มีการแจ้งเตือน
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  n.isRead ? "" : "bg-emerald-50/40"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.isRead ? "bg-slate-200" : "bg-emerald-500"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {n.title}
                    {!n.isRead && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        ใหม่
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.createdAt.toLocaleDateString("th-TH")}{" "}
                    {n.createdAt.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      อ่านแล้ว
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
