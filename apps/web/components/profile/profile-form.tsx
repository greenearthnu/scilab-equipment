"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";

interface ProfileUser {
  name: string;
  className: string | null;
  studentId: string | null;
  phone: string | null;
  telegramUserId: string | null;
  telegramAlertStyle: string | null;
  avatarUrl: string | null;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined
  );
  const [preview, setPreview] = useState<string | null>(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          รูปโปรไฟล์
        </label>
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="รูปโปรไฟล์"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-500">
              ?
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              เลือกรูป
            </button>
            <p className="text-xs text-slate-400">JPG, PNG, WEBP ขนาดไม่เกิน 2MB</p>
          </div>
        </div>
        {state?.errors?.avatar && (
          <p className="mt-1 text-xs text-red-600">{state.errors.avatar[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ชื่อ-นามสกุล
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={user.name}
          className={inputClass}
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="className"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ห้องเรียน / แผนก (เช่น ม.4/1)
        </label>
        <input
          id="className"
          name="className"
          type="text"
          defaultValue={user.className ?? ""}
          placeholder="ไม่บังคับ"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="studentId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รหัสนักเรียน / รหัสบุคลากร
        </label>
        <input
          id="studentId"
          name="studentId"
          type="text"
          defaultValue={user.studentId ?? ""}
          placeholder="ไม่บังคับ"
          className={inputClass}
        />
        {state?.errors?.studentId && (
          <p className="mt-1 text-xs text-red-600">{state.errors.studentId[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          เบอร์โทรศัพท์
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          placeholder="ไม่บังคับ"
          className={inputClass}
        />
        {state?.errors?.phone && (
          <p className="mt-1 text-xs text-red-600">{state.errors.phone[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="telegramUserId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Telegram User ID (สำหรับผู้ดูแลที่ต้องการกดอนุมัติ/ปฏิเสธจากแชท)
        </label>
        <input
          id="telegramUserId"
          name="telegramUserId"
          type="text"
          inputMode="numeric"
          defaultValue={user.telegramUserId ?? ""}
          placeholder="เช่น 123456789"
          className={inputClass}
        />
        {state?.errors?.telegramUserId && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.telegramUserId[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          หาได้โดยส่งข้อความหา @userinfobot ใน Telegram แล้วดูเลข “Id”
        </p>
      </div>

      <div>
        <label
          htmlFor="telegramAlertStyle"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รูปแบบการแจ้งเตือน Telegram
        </label>
        <select
          id="telegramAlertStyle"
          name="telegramAlertStyle"
          defaultValue={user.telegramAlertStyle ?? ""}
          className={inputClass}
        >
          <option value="">ใช้ค่าเริ่มต้นจากระบบ</option>
          <option value="FULL">สรุปเต็ม (ทุกบรรทัด)</option>
          <option value="SHORT">สรุปสั้น (1–2 บรรทัด)</option>
        </select>
        {state?.errors?.telegramAlertStyle && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.telegramAlertStyle[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          ใช้ได้เฉพาะผู้ดูแลที่ผูก Telegram User ID — เลือกสรุปสั้นเพื่อประหยัดเวลา
          อ่าน หรือสรุปเต็มเพื่อดูรายละเอียดครบ
        </p>
      </div>

      {state?.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      </button>
    </form>
  );
}
