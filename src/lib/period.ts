/**
 * Regras de cálculo dos períodos de apuração.
 *
 * O fechamento NÃO segue o calendário (dia 1 ao último dia do mês).
 * O período vai do "dia de fechamento" de um mês até o "dia de fechamento"
 * do mês seguinte (exclusive no limite superior, ver `isDateInPeriod`).
 *
 * Ex.: closingDay = 10 → período: 10/08 até 10/09.
 *
 * Todas as datas são tratadas como strings "YYYY-MM-DD" (sem componente de
 * hora/timezone) para evitar bugs de fuso horário. A aritmética de
 * mês/dia é feita manualmente.
 */

export interface Period {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (exclusive — é o início do próximo período)
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toISO(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

function parseISO(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** Retorna a data de fechamento (clampada ao último dia do mês) para year/month. */
function closingDateOf(year: number, month: number, closingDay: number): string {
  const clampedDay = Math.min(closingDay, daysInMonth(year, month));
  return toISO(year, month, clampedDay);
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = (month - 1) + delta;
  const newYear = year + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12 + 1;
  return { year: newYear, month: newMonth };
}

/**
 * Dado um dia de referência (YYYY-MM-DD) e o dia de fechamento contratual,
 * retorna o período { start, end } ao qual essa data pertence.
 * A data de fechamento em si (ex.: dia 10) já pertence ao PRÓXIMO período.
 */
export function getPeriodForDate(referenceDateISO: string, closingDay: number): Period {
  const { year, month, day } = parseISO(referenceDateISO);
  const thisMonthClosing = closingDateOf(year, month, closingDay);

  if (day >= parseISO(thisMonthClosing).day) {
    // já estamos no período que começa neste mês
    const next = addMonths(year, month, 1);
    const end = closingDateOf(next.year, next.month, closingDay);
    return { start: thisMonthClosing, end };
  } else {
    const prev = addMonths(year, month, -1);
    const start = closingDateOf(prev.year, prev.month, closingDay);
    return { start, end: thisMonthClosing };
  }
}

/** Período atual, com base na data de hoje. */
export function getCurrentPeriod(closingDay: number, today: Date = new Date()): Period {
  const iso = toISO(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return getPeriodForDate(iso, closingDay);
}

/** Retorna o período imediatamente anterior a um período dado. */
export function getPreviousPeriod(period: Period, closingDay: number): Period {
  const { year, month, day } = parseISO(period.start);
  const prev = addMonths(year, month, -1);
  const start = closingDateOf(prev.year, prev.month, closingDay);
  return { start, end: period.start };
}

/** Retorna o período imediatamente seguinte a um período dado. */
export function getNextPeriod(period: Period, closingDay: number): Period {
  const { year, month } = parseISO(period.end);
  const next = addMonths(year, month, 1);
  const end = closingDateOf(next.year, next.month, closingDay);
  return { start: period.end, end };
}

/**
 * Gera a lista de períodos entre uma data inicial (início do contrato) e o
 * período atual (inclusive), em ordem cronológica.
 */
export function listPeriodsSince(
  contractStartDateISO: string,
  closingDay: number,
  today: Date = new Date()
): Period[] {
  const periods: Period[] = [];
  let cursor = getPeriodForDate(contractStartDateISO, closingDay);
  const current = getCurrentPeriod(closingDay, today);

  // proteção contra loop infinito
  let guard = 0;
  while (guard < 1000) {
    periods.push(cursor);
    if (cursor.start === current.start) break;
    cursor = getNextPeriod(cursor, closingDay);
    guard++;
  }
  return periods;
}

/** Verifica se uma data (YYYY-MM-DD) está dentro do período [start, end). */
export function isDateInPeriod(dateISO: string, period: Period): boolean {
  return dateISO >= period.start && dateISO < period.end;
}

export function formatPeriodLabel(period: Period): string {
  const fmt = (iso: string) => {
    const { year, month, day } = parseISO(iso);
    return `${pad2(day)}/${pad2(month)}/${year}`;
  };
  return `${fmt(period.start)} → ${fmt(period.end)}`;
}

export function todayISO(): string {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
