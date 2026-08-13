import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminRole } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";
import { getScoreSettings } from "@/lib/score-settings";
import SettingsForm from "@/components/settings/settings-form";

export const metadata: Metadata = {
  title: "การตั้งค่า",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }

  const settings = await getScoreSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">การตั้งค่า</h1>
        <p className="mt-1 text-slate-600">
          ตั้งค่าเกณฑ์คะแนนการใช้งานของผู้ใช้ (มีผลทันทีกับทั้งเว็บและมือถือ)
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
