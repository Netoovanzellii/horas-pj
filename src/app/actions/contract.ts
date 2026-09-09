"use server";

import { db } from "@/db/client";
import { contracts, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { contractFormSchema, clientFormSchema } from "@/lib/validation";
import type { ActionResult } from "./requests";

export async function updateContractConfig(
  contractId: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = contractFormSchema.safeParse({
    hoursPart: formData.get("hoursPart"),
    minutesPart: formData.get("minutesPart"),
    closingDay: formData.get("closingDay"),
    monthlyValueCents: formData.get("monthlyValueCents") || undefined,
    overtimeHourValueCents: formData.get("overtimeHourValueCents") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const hoursPerPeriodMinutes = data.hoursPart * 60 + data.minutesPart;
  if (hoursPerPeriodMinutes <= 0) {
    return { ok: false, error: "A franquia deve ser maior que zero." };
  }

  await db
    .update(contracts)
    .set({
      hoursPerPeriodMinutes,
      closingDay: data.closingDay,
      monthlyValueCents: data.monthlyValueCents ?? null,
      overtimeHourValueCents: data.overtimeHourValueCents ?? null,
    })
    .where(eq(contracts.id, contractId));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateClientInfo(
  clientId: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = clientFormSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    cnpj: formData.get("cnpj")?.toString() || undefined,
    email: formData.get("email")?.toString() || undefined,
    phone: formData.get("phone")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  await db
    .update(clients)
    .set({
      name: data.name,
      cnpj: data.cnpj ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    })
    .where(eq(clients.id, clientId));

  revalidatePath("/", "layout");
  return { ok: true };
}
