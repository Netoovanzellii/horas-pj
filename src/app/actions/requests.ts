"use server";

import { db } from "@/db/client";
import { requests, timeEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestFormSchema } from "@/lib/validation";
import { generateNextRequestNumber } from "@/lib/requestNumber";
import { getActiveContract } from "@/lib/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  const s = (v ?? "").toString().trim();
  return s === "" ? undefined : s;
}

export async function createRequest(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const contract = await getActiveContract();
  if (!contract) return { ok: false, error: "Nenhum contrato ativo configurado." };

  const parsed = requestFormSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: emptyToUndefined(formData.get("description")),
    requester: emptyToUndefined(formData.get("requester")),
    openedAt: formData.get("openedAt")?.toString() ?? "",
    startedAt: emptyToUndefined(formData.get("startedAt")),
    completedAt: emptyToUndefined(formData.get("completedAt")),
    status: formData.get("status")?.toString() ?? "Aberta",
    priority: formData.get("priority")?.toString() ?? "Média",
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const year = new Date(data.openedAt).getFullYear() || new Date().getFullYear();
  const number = await generateNextRequestNumber(year);

  const [inserted] = await db
    .insert(requests)
    .values({
      contractId: contract.id,
      number,
      title: data.title,
      description: data.description ?? null,
      requester: data.requester ?? null,
      openedAt: data.openedAt,
      startedAt: data.startedAt ?? null,
      completedAt: data.completedAt ?? null,
      status: data.status,
      priority: data.priority,
      notes: data.notes ?? null,
    })
    .returning({ id: requests.id });

  revalidatePath("/solicitacoes");
  revalidatePath("/");
  redirect(`/solicitacoes/${inserted.id}`);
}

export async function updateRequest(id: number, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = requestFormSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: emptyToUndefined(formData.get("description")),
    requester: emptyToUndefined(formData.get("requester")),
    openedAt: formData.get("openedAt")?.toString() ?? "",
    startedAt: emptyToUndefined(formData.get("startedAt")),
    completedAt: emptyToUndefined(formData.get("completedAt")),
    status: formData.get("status")?.toString() ?? "Aberta",
    priority: formData.get("priority")?.toString() ?? "Média",
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  await db
    .update(requests)
    .set({
      title: data.title,
      description: data.description ?? null,
      requester: data.requester ?? null,
      openedAt: data.openedAt,
      startedAt: data.startedAt ?? null,
      completedAt: data.completedAt ?? null,
      status: data.status,
      priority: data.priority,
      notes: data.notes ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(requests.id, id));

  revalidatePath(`/solicitacoes/${id}`);
  revalidatePath("/solicitacoes");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteRequest(id: number): Promise<void> {
  await db.delete(timeEntries).where(eq(timeEntries.requestId, id));
  await db.delete(requests).where(eq(requests.id, id));
  revalidatePath("/solicitacoes");
  revalidatePath("/");
  redirect("/solicitacoes");
}
