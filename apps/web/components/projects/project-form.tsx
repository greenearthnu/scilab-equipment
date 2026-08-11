"use client";

import { useActionState } from "react";
import {
  createProject,
  type ProjectFormState,
} from "@/lib/actions/projects";

export default function ProjectForm() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    createProject,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ชื่อโครงงาน
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="เช่น การผลิตปุ๋ยชีวภาพจากเปลือกกล้วย"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.title && (
          <p className="mt-1 text-xs text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="summary"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รายละเอียดโครงงาน
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          required
          placeholder="สรุปแนวคิดและผลงานโดยย่อ"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.summary && (
          <p className="mt-1 text-xs text-red-600">{state.errors.summary[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="studentNames"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ชื่อนักเรียนผู้จัดทำ
        </label>
        <input
          id="studentNames"
          name="studentNames"
          type="text"
          required
          placeholder="เช่น นายกิตติ แสงทอง, น.ส.พิมพ์ชนก นาคบุตร"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.studentNames && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.studentNames[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="className"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            ชั้นเรียน (ไม่บังคับ)
          </label>
          <input
            id="className"
            name="className"
            type="text"
            placeholder="เช่น ม.5/1"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label
            htmlFor="teacherName"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            อาจารย์ที่ปรึกษา (ไม่บังคับ)
          </label>
          <input
            id="teacherName"
            name="teacherName"
            type="text"
            placeholder="เช่น ครูสมชาย ใจดี"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="award"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รางวัล/เกียรติยศ (ไม่บังคับ)
        </label>
        <input
          id="award"
          name="award"
          type="text"
          placeholder="เช่น รางวัลชนะเลิศ งานสัปดาห์วิทยาศาสตร์"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label
          htmlFor="image"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รูปโครงงาน (ไม่บังคับ)
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
        {state?.errors?.image && (
          <p className="mt-1 text-xs text-red-600">{state.errors.image[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="featured"
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        เน้นแสดงบนหน้าแรก (โครงงานดีเด่น)
      </label>

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกโครงงาน"}
      </button>
    </form>
  );
}
