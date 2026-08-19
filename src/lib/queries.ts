import { db } from "@/db/client";
import { clients, contracts, requests, timeEntries, periodClosures } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { calcBalance, type HoursBalance } from "./hours";
import { isDateInPeriod, type Period } from "./period";

export type Contract = typeof contracts.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type RequestRow = typeof requests.$inferSelect;
export type TimeEntryRow = typeof timeEntries.$inferSelect;

/** MVP: assume um único cliente/contrato ativo. Estrutura já suporta múltiplos. */
export async function getActiveContract(): Promise<(Contract & { client: Client }) | null> {
  const rows = await db
    .select()
    .from(contracts)
    .innerJoin(clients, eq(contracts.clientId, clients.id))
    .where(eq(contracts.status, "ativo"))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row.contracts, client: row.clients };
}

export async function getAllRequestsForContract(contractId: number): Promise<RequestRow[]> {
  return db.select().from(requests).where(eq(requests.contractId, contractId));
}

export async function getRequestById(id: number): Promise<RequestRow | null> {
  const rows = await db.select().from(requests).where(eq(requests.id, id));
  return rows[0] ?? null;
}

export async function getAllTimeEntriesForRequests(requestIds: number[]): Promise<TimeEntryRow[]> {
  if (requestIds.length === 0) return [];
  return db.select().from(timeEntries).where(inArray(timeEntries.requestId, requestIds));
}

export async function getTimeEntriesForRequest(requestId: number): Promise<TimeEntryRow[]> {
  return db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.requestId, requestId))
    .orderBy(timeEntries.date, timeEntries.startTime);
}

export async function getRequestTotalMinutes(requestId: number): Promise<number> {
  const entries = await getTimeEntriesForRequest(requestId);
  return entries.reduce((sum, e) => sum + e.durationMinutes, 0);
}

export interface PeriodSummary {
  period: Period;
  balance: HoursBalance;
  requestCount: number;
  completedCount: number;
  inProgressCount: number;
  closed: boolean;
  requests: (RequestRow & { totalMinutes: number })[];
  entries: TimeEntryRow[];
}

/**
 * Monta o resumo completo de um período: horas usadas (calculadas a partir
 * dos apontamentos), saldo, contadores de solicitações e status de
 * fechamento. Os totais nunca são armazenados — sempre recalculados.
 */
export async function getPeriodSummary(contract: Contract, period: Period): Promise<PeriodSummary> {
  const allRequests = await getAllRequestsForContract(contract.id);
  const requestIds = allRequests.map((r) => r.id);
  const allEntries = await getAllTimeEntriesForRequests(requestIds);

  const entriesInPeriod = allEntries.filter((e) => isDateInPeriod(e.date, period));
  const usedMinutes = entriesInPeriod.reduce((sum, e) => sum + e.durationMinutes, 0);
  const balance = calcBalance(contract.hoursPerPeriodMinutes, usedMinutes);

  // Uma solicitação "pertence" ao período se possui ao menos um apontamento nele.
  const requestIdsInPeriod = new Set(entriesInPeriod.map((e) => e.requestId));
  const entriesByRequest = new Map<number, TimeEntryRow[]>();
  for (const e of entriesInPeriod) {
    const list = entriesByRequest.get(e.requestId) ?? [];
    list.push(e);
    entriesByRequest.set(e.requestId, list);
  }

  const requestsInPeriod = allRequests
    .filter((r) => requestIdsInPeriod.has(r.id))
    .map((r) => ({
      ...r,
      totalMinutes: (entriesByRequest.get(r.id) ?? []).reduce((s, e) => s + e.durationMinutes, 0),
    }));

  const completedCount = requestsInPeriod.filter((r) => r.status === "Concluída").length;
  const inProgressCount = requestsInPeriod.filter(
    (r) => r.status === "Em andamento" || r.status === "Em análise" || r.status === "Aguardando retorno"
  ).length;

  const closed = await isPeriodClosed(contract.id, period);

  return {
    period,
    balance,
    requestCount: requestsInPeriod.length,
    completedCount,
    inProgressCount,
    closed,
    requests: requestsInPeriod,
    entries: entriesInPeriod,
  };
}

export async function isPeriodClosed(contractId: number, period: Period): Promise<boolean> {
  const rows = await db.select().from(periodClosures).where(eq(periodClosures.contractId, contractId));
  return rows.some((c) => c.periodStart === period.start && c.periodEnd === period.end);
}

export async function closePeriod(contractId: number, period: Period): Promise<void> {
  if (await isPeriodClosed(contractId, period)) return;
  await db.insert(periodClosures).values({ contractId, periodStart: period.start, periodEnd: period.end });
}

export async function reopenPeriod(contractId: number, period: Period): Promise<void> {
  // remove apenas o registro do período específico
  const rows = await db.select().from(periodClosures).where(eq(periodClosures.contractId, contractId));
  for (const r of rows) {
    if (r.periodStart === period.start && r.periodEnd === period.end) {
      await db.delete(periodClosures).where(eq(periodClosures.id, r.id));
    }
  }
}
