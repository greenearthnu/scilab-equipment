import type { Metadata } from "next";
import Link from "next/link";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import ProjectForm from "@/components/projects/project-form";

export const metadata: Metadata = {
  title: "เพิ่มโครงงาน",
};

export default async function NewProjectPage() {
  const user = await getCurrentUser();

  if (user.role !== ROLES.LAB_ADMIN) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← กลับ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">เพิ่มโครงงานใหม่</h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ProjectForm />
      </div>
    </div>
  );
}
