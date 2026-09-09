import { getActiveContract, getPeriodSummary, getTimeEntriesForRequest } from "@/lib/queries";
import { getPeriodForDate } from "@/lib/period";
import type { Contract, Client, RequestRow, TimeEntryRow, PeriodSummary } from "@/lib/queries";
import type { Period } from "@/lib/period";

export type PeriodReportGroup = {
  request: RequestRow & { totalMinutes: number };
  entries: TimeEntryRow[];
  subtotalMinutes: number;
};

export type PeriodReportData = {
  contract: Contract & { client: Client };
  period: Period;
  summary: PeriodSummary;
  requests: (RequestRow & { totalMinutes: number })[];
  groups: PeriodReportGroup[];
  totalMinutes: number;
};

/**
 * Reúne tudo que o relatório de fechamento precisa para um `start` (data de
 * início do período, YYYY-MM-DD) no contrato ativo. Retorna `null` quando o
 * `start` é inválido, não há contrato ativo ou não bate com o início real do
 * período — os chamadores devem tratar como 404.
 */
export async function getPeriodReportData(start: string): Promise<PeriodReportData | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;

  const contract = await getActiveContract();
  if (!contract) return null;

  const period = getPeriodForDate(start, contract.closingDay);
  if (period.start !== start) return null;

  const summary = await getPeriodSummary(contract, period);
  const requests = [...summary.requests].sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const groups = await Promise.all(
    requests.map(async (request) => {
      const all = await getTimeEntriesForRequest(request.id);
      const entries = all
        .filter((e) => e.date >= period.start && e.date < period.end)
        .sort((a, b) => a.date.localeCompare(b.date));
      const subtotalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
      return { request, entries, subtotalMinutes };
    })
  );

  const totalMinutes = groups.reduce((s, g) => s + g.subtotalMinutes, 0);

  return { contract, period, summary, requests, groups, totalMinutes };
}
