import type { Metadata } from "next";
import Link from "next/link";
import { isAdminRole } from "@scilab/shared";
import { db } from "@scilab/db";
import { getCurrentUser } from "@/lib/dal";
import ProjectForm from "@/components/projects/project-form";

export const metadata: Metadata = {
  title: "แก้ไขโครงงาน",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!isAdminRole(user.role)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้
      </p>
    );
  }

  const { id: rawId } = await params;
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    // keep raw id if it is not valid percent-encoding
  }
  const project = await db.project.findUnique({
    where: { id },
    include: {
      awards: { orderBy: { createdAt: "asc" } },
      images: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!project) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        ไม่พบโครงงานนี้ในระบบ
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← กลับ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">แก้ไขโครงงาน</h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <ProjectForm project={project} />
      </div>
    </div>
  );
}
