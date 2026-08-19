import type { Period } from "./period";
import type { UsagePoint } from "@/components/UsageChart";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function toLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Constrói a série de utilização acumulada de horas dentro de um período,
 * do início até a data limite informada (hoje, ou o fim do período se já
 * estiver encerrado).
 */
export function buildUsageSeries(
  entries: { date: string; durationMinutes: number }[],
  period: Period,
  todayISO: string
): UsagePoint[] {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.durationMinutes);
  }

  const lastDayExclusiveEnd = period.end < todayISO ? period.end : addDays(todayISO, 1);
  const points: UsagePoint[] = [];
  let cumulative = 0;
  let cursor = period.start;

  // proteção contra loop infinito
  let guard = 0;
  while (cursor < lastDayExclusiveEnd && guard < 400) {
    cumulative += byDate.get(cursor) ?? 0;
    points.push({ dateLabel: toLabel(cursor), cumulativeMinutes: cumulative });
    cursor = addDays(cursor, 1);
    guard++;
  }

  if (points.length === 0) {
    points.push({ dateLabel: toLabel(period.start), cumulativeMinutes: 0 });
  }

  return points;
}
