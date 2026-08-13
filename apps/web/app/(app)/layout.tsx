import type { ReactNode } from "react";
import { db } from "@scilab/db";
import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/lib/dal";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <>
      <Navbar
        userName={user.name}
        userRole={user.role}
        avatarUrl={user.avatarUrl}
        unreadCount={unreadCount}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
