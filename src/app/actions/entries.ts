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

type ResolvedEntry = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  activityType: (typeof timeEntries.$inferInsert)["activityType"];
  description: string | null;
};

/**
 * Valida o FormData de um apontamento (criar OU editar) e resolve a duração,
 * seja a partir de hora inicial/final, seja do valor informado diretamente.
 */
function resolveEntryFromForm(formData: FormData): { ok: true; data: ResolvedEntry } | { ok: false; error: string } {
  const durationRaw = emptyToUndefined(formData.get("durationMinutes"));

  const parsed = timeEntryFormSchema.safeParse({
    requestId: Number(formData.get("requestId")) || 1, // não é persistido daqui; presença só para o schema
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

  return {
    ok: true,
    data: {
      date: data.date,
      startTime,
      endTime,
      durationMinutes,
      activityType: data.activityType,
      description: data.description ?? null,
    },
  };
}

function revalidateEntryViews(requestId: number) {
  revalidatePath(`/solicitacoes/${requestId}`);
  revalidatePath("/solicitacoes");
  revalidatePath("/");
  revalidatePath("/periodos");
}

export async function createTimeEntry(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const requestId = Number(formData.get("requestId"));
  if (!requestId) return { ok: false, error: "Solicitação inválida." };

  const resolved = resolveEntryFromForm(formData);
  if (!resolved.ok) return resolved;

  await db.insert(timeEntries).values({ requestId, ...resolved.data });

  revalidateEntryViews(requestId);
  return { ok: true };
}

export async function updateTimeEntry(
  id: number,
  requestId: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  if (!id || !requestId) return { ok: false, error: "Apontamento inválido." };

  const resolved = resolveEntryFromForm(formData);
  if (!resolved.ok) return resolved;

  await db.update(timeEntries).set(resolved.data).where(eq(timeEntries.id, id));

  revalidateEntryViews(requestId);
  return { ok: true };
}

export async function deleteTimeEntry(id: number, requestId: number): Promise<void> {
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
  revalidateEntryViews(requestId);
}
