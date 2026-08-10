import type { Metadata } from "next";
import { ROLE_LABELS } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import ProfileForm from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "โปรไฟล์",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">โปรไฟล์</h1>
        <p className="mt-1 text-slate-600">
          จัดการรูปและข้อมูลส่วนตัวของคุณ
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-emerald-100"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        <ProfileForm user={user} />
      </div>
    </div>
  );
}
