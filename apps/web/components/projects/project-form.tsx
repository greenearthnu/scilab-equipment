"use client";

import { useActionState, useState } from "react";
import {
  AWARD_LEVELS,
  AWARD_LEVEL_LABELS,
  AWARD_LEVEL_ORDER,
  type AwardLevel,
} from "@scilab/shared";
import {
  createProject,
  updateProject,
  type ProjectFormData,
  type ProjectFormState,
} from "@/lib/actions/projects";

type AwardRow = { title: string; level: AwardLevel };

export default function ProjectForm({ project }: { project?: ProjectFormData }) {
  const isEdit = Boolean(project);
  const action = project
    ? updateProject.bind(null, project.id)
    : createProject;

  const [state, submit, pending] = useActionState<ProjectFormState, FormData>(
    action,
    undefined
  );
  const [awards, setAwards] = useState<AwardRow[]>(
    project?.awards.map((a) => ({ title: a.title, level: a.level })) ?? []
  );
  const existingImages = project?.images ?? [];
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const updateAward = (index: number, patch: Partial<AwardRow>) => {
    setAwards((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const handleImagesChange = (files: FileList | null) => {
    setImageError(null);
    const selected = files ? Array.from(files) : [];
    const total = existingImages.length - removeIds.length + selected.length;
    if (total > 3) {
      setImageError("รวมรูปทั้งหมดได้สูงสุด 3 ภาพ");
      return;
    }
    setNewFiles(selected);
  };

  const removeExistingImage = (id: string) => {
    setImageError(null);
    setRemoveIds((prev) => [...prev, id]);
  };

  const restoreExistingImage = (id: string) => {
    setRemoveIds((prev) => prev.filter((rid) => rid !== id));
  };

  const remainingExisting = existingImages.length - removeIds.length;

  return (
    <form action={submit} className="space-y-4">
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
          defaultValue={project?.title}
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
          defaultValue={project?.summary}
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
          defaultValue={project?.studentNames}
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
            ชั้นเรียน
          </label>
          <input
            id="className"
            name="className"
            type="text"
            required
            defaultValue={project?.className}
            placeholder="เช่น ม.5/1"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {state?.errors?.className && (
            <p className="mt-1 text-xs text-red-600">{state.errors.className[0]}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="teacherName"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            อาจารย์ที่ปรึกษา
          </label>
          <input
            id="teacherName"
            name="teacherName"
            type="text"
            required
            defaultValue={project?.teacherName}
            placeholder="เช่น ครูสมชาย ใจดี"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {state?.errors?.teacherName && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.teacherName[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            รางวัล/เกียรติยศ (ไม่บังคับ)
          </label>
          <button
            type="button"
            onClick={() =>
              setAwards((prev) => [
                ...prev,
                { title: "", level: AWARD_LEVELS.OTHER },
              ])
            }
            className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            + เพิ่มรางวัล
          </button>
        </div>
        {awards.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-400">
            ยังไม่มีรางวัล — กด &quot;+ เพิ่มรางวัล&quot; เพื่อระบุรางวัลที่โครงงานได้รับ
          </p>
        ) : (
          <ul className="space-y-2">
            {awards.map((award, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  name="awardTitle"
                  type="text"
                  value={award.title}
                  onChange={(e) => updateAward(i, { title: e.target.value })}
                  placeholder="เช่น รางวัลชนะเลิศ งานสัปดาห์วิทยาศาสตร์"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  name="awardLevel"
                  value={award.level}
                  onChange={(e) =>
                    updateAward(i, { level: e.target.value as AwardLevel })
                  }
                  className="shrink-0 rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {AWARD_LEVEL_ORDER.map((level) => (
                    <option key={level} value={level}>
                      {AWARD_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setAwards((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                  aria-label="ลบรางวัล"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
        {state?.errors?.awardTitle && (
          <p className="mt-1 text-xs text-red-600">{state.errors.awardTitle[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="year"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          ปีโครงงาน
        </label>
        <input
          id="year"
          name="year"
          type="number"
          min={2000}
          max={2100}
          defaultValue={project?.year ?? currentYear}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {state?.errors?.year && (
          <p className="mt-1 text-xs text-red-600">{state.errors.year[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="images"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          รูปโครงงาน (รวมทั้งหมดไม่เกิน 3 ภาพ)
        </label>

        {existingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {existingImages.map((img) => {
              const removed = removeIds.includes(img.id);
              return (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className={`h-20 w-28 rounded-lg object-cover ${removed ? "opacity-40 grayscale" : ""}`}
                  />
                  {removed ? (
                    <button
                      type="button"
                      onClick={() => restoreExistingImage(img.id)}
                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/60 text-[11px] font-semibold text-white"
                    >
                      กู้คืน
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm"
                      aria-label="ลบรูปนี้"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {removeIds.map((id) => (
          <input key={id} type="hidden" name="removeImageId" value={id} />
        ))}

        {newFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {newFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-20 w-28 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewFiles((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm"
                  aria-label="ลบรูปที่เลือก"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          id="images"
          name="images"
          type="file"
          multiple
          required={remainingExisting === 0}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleImagesChange(e.target.files)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          {isEdit
            ? "เลือกรูปใหม่เพิ่มได้ (รวมกับรูปเดิมไม่เกิน 3 ภาพ) รูปแรกใช้เป็นภาพปก"
            : "เลือกได้ 1-3 ภาพ (JPG, PNG, WEBP ขนาดไม่เกิน 5MB ต่อภาพ) รูปแรกใช้เป็นภาพปก"}
        </p>
        {imageError && (
          <p className="mt-1 text-xs text-red-600">{imageError}</p>
        )}
        {state?.errors?.image && (
          <p className="mt-1 text-xs text-red-600">{state.errors.image[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={project?.featured ?? false}
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
        {pending
          ? "กำลังบันทึก..."
          : isEdit
            ? "บันทึกการแก้ไข"
            : "บันทึกโครงงาน"}
      </button>
    </form>
  );
}
