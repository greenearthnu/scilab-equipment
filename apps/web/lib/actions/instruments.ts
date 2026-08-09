"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@scilab/db";
import { ROLES } from "@scilab/shared";
import { getCurrentUser } from "@/lib/dal";

const CreateInstrumentSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อเครื่องมือ").trim(),
  category: z.enum([
    "MICROSCOPE",
    "MEASURING",
    "CHEMICAL",
    "GLASSWARE",
    "ELECTRICAL",
    "OTHER",
  ]),
  description: z.string().max(1000).trim().optional(),
  totalQuantity: z.coerce.number().int().positive(),
  location: z.string().max(100).trim().optional(),
});

export type InstrumentFormState = {
  errors?: {
    name?: string[];
    category?: string[];
    description?: string[];
    totalQuantity?: string[];
    location?: string[];
  };
  message?: string;
};

export async function createInstrument(
  state: InstrumentFormState,
  formData: FormData
): Promise<InstrumentFormState> {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    return { message: "เฉพาะผู้ดูแลห้องแล็บเท่านั้นที่เพิ่มเครื่องมือได้" };
  }

  const validated = CreateInstrumentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    totalQuantity: formData.get("totalQuantity"),
    location: formData.get("location"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, category, description, totalQuantity, location } =
    validated.data;

  await db.instrument.create({
    data: {
      name,
      category,
      description: description || null,
      totalQuantity,
      availableCount: totalQuantity,
      location: location || null,
    },
  });

  revalidatePath("/instruments");
  return { message: undefined };
}

export async function setInstrumentStatus(
  instrumentId: string,
  status: "AVAILABLE" | "MAINTENANCE" | "DISABLED"
) {
  const user = await getCurrentUser();
  if (user.role !== ROLES.LAB_ADMIN) {
    throw new Error("ไม่มีสิทธิ์ดำเนินการนี้");
  }

  await db.instrument.update({
    where: { id: instrumentId },
    data: { status },
  });

  revalidatePath("/instruments");
}
