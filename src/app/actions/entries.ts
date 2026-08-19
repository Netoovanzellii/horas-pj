"use server";

import { db } from "@/db/client";
import { timeEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { timeEntryFormSchema } from "@/lib/validation";
import { calcDurationMinutes } from "@/lib/time";
import type { ActionResult } from "./requests";

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  const s = (v ?? "").toString().trim();
  return s === "" ? undefined : s;
}

export async function createTimeEntry(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const requestId = Number(formData.get("requestId"));
  const durationRaw = emptyToUndefined(formData.get("durationMinutes"));

  const parsed = timeEntryFormSchema.safeParse({
    requestId,
    date: formData.get("date")?.toString() ?? "",
    activityType: formData.get("activityType")?.toString() ?? "Outros",
    description: emptyToUndefined(formData.get("description")),
    startTime: emptyToUndefined(formData.get("startTime")) ?? "",
    endTime: emptyToUndefined(formData.get("endTime")) ?? "",
    durationMinutes: durationRaw ? Number(durationRaw) : undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  let durationMinutes: number;
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (data.startTime && data.endTime) {
    try {
      durationMinutes = calcDurationMinutes(data.startTime, data.endTime);
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    startTime = data.startTime;
    endTime = data.endTime;
  } else if (data.durationMinutes) {
    durationMinutes = data.durationMinutes;
  } else {
    return { ok: false, error: "Informe horário inicial/final ou a duração." };
  }

  await db.insert(timeEntries).values({
    requestId: data.requestId,
    date: data.date,
    startTime,
    endTime,
    durationMinutes,
    activityType: data.activityType,
    description: data.description ?? null,
  });

  revalidatePath(`/solicitacoes/${data.requestId}`);
  revalidatePath("/solicitacoes");
  revalidatePath("/");
  revalidatePath("/periodos");
  return { ok: true };
}

export async function deleteTimeEntry(id: number, requestId: number): Promise<void> {
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
  revalidatePath(`/solicitacoes/${requestId}`);
  revalidatePath("/solicitacoes");
  revalidatePath("/");
  revalidatePath("/periodos");
}
