"use server";

import { db } from "@/db/client";
import { contracts, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contractFormSchema, clientFormSchema, newClientFormSchema } from "@/lib/validation";
import { ACTIVE_CONTRACT_COOKIE, ACTIVE_CONTRACT_COOKIE_MAX_AGE } from "@/lib/activeContract";
import { parseBRLToCents } from "@/lib/money";
import type { ActionResult } from "./requests";

/**
 * Lê os campos de valor (reais, texto pt-BR) do formulário e devolve em
 * centavos. Retorna `{ error }` se algum valor não-vazio for inválido.
 */
function readMoneyFields(formData: FormData):
  | { monthlyValueCents: number | null; overtimeHourValueCents: number | null }
  | { error: string } {
  const monthlyValueCents = parseBRLToCents(formData.get("monthlyValue")?.toString());
  const overtimeHourValueCents = parseBRLToCents(formData.get("overtimeHourValue")?.toString());
  if (Number.isNaN(monthlyValueCents) || Number.isNaN(overtimeHourValueCents)) {
    return { error: "Valor inválido. Informe apenas números, ex.: 1.800,00." };
  }
  return { monthlyValueCents, overtimeHourValueCents };
}

export async function updateContractConfig(
  contractId: number,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const money = readMoneyFields(formData);
  if ("error" in money) return { ok: false, error: money.error };

  const parsed = contractFormSchema.safeParse({
    hoursPart: formData.get("hoursPart"),
    minutesPart: formData.get("minutesPart"),
    closingDay: formData.get("closingDay"),
    monthlyValueCents: money.monthlyValueCents ?? undefined,
    overtimeHourValueCents: money.overtimeHourValueCents ?? undefined,
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

/** Troca o contrato/cliente em uso no momento (seletor no topo do app). */
export async function setActiveContractAction(contractId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CONTRACT_COOKIE, String(contractId), {
    path: "/",
    maxAge: ACTIVE_CONTRACT_COOKIE_MAX_AGE,
  });
  revalidatePath("/", "layout");
}

export async function toggleContractStatusAction(contractId: number, currentStatus: "ativo" | "encerrado"): Promise<void> {
  const nextStatus = currentStatus === "ativo" ? "encerrado" : "ativo";
  await db.update(contracts).set({ status: nextStatus }).where(eq(contracts.id, contractId));
  revalidatePath("/", "layout");
}

/** Cadastra um novo cliente + contrato e já passa a usá-lo. */
export async function createClientAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const money = readMoneyFields(formData);
  if ("error" in money) return { ok: false, error: money.error };

  const parsed = newClientFormSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    cnpj: formData.get("cnpj")?.toString() || undefined,
    email: formData.get("email")?.toString() || undefined,
    phone: formData.get("phone")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    hoursPart: formData.get("hoursPart"),
    minutesPart: formData.get("minutesPart"),
    closingDay: formData.get("closingDay"),
    startDate: formData.get("startDate")?.toString() ?? "",
    monthlyValueCents: money.monthlyValueCents ?? undefined,
    overtimeHourValueCents: money.overtimeHourValueCents ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const hoursPerPeriodMinutes = data.hoursPart * 60 + data.minutesPart;
  if (hoursPerPeriodMinutes <= 0) {
    return { ok: false, error: "A franquia deve ser maior que zero." };
  }

  const [client] = await db
    .insert(clients)
    .values({
      name: data.name,
      cnpj: data.cnpj ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    })
    .returning({ id: clients.id });

  const [contract] = await db
    .insert(contracts)
    .values({
      clientId: client.id,
      hoursPerPeriodMinutes,
      closingDay: data.closingDay,
      startDate: data.startDate,
      monthlyValueCents: data.monthlyValueCents ?? null,
      overtimeHourValueCents: data.overtimeHourValueCents ?? null,
      status: "ativo",
    })
    .returning({ id: contracts.id });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CONTRACT_COOKIE, String(contract.id), {
    path: "/",
    maxAge: ACTIVE_CONTRACT_COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  redirect("/");
}
