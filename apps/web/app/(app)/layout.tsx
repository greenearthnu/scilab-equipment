import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import { getCurrentUser } from "@/lib/dal";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar userName={user.name} userRole={user.role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
