/**
 * Utilitários de tempo. Duração é sempre armazenada/manipulada em MINUTOS
 * (inteiro). Conversão para o formato "HhMM" (ex.: 2h05) é feita apenas na
 * apresentação.
 */

/**
 * Data/hora "agora" formatada no fuso de Brasília (o servidor da Netlify roda
 * em UTC, então sem `timeZone` o horário sai 3h adiantado).
 * Ex.: "10/09/2026, 10:59".
 */
export function formatDateTimeBR(date: Date = new Date()): string {
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${hours}h${minutes.toString().padStart(2, "0")}`;
}

/** Formata em "2h" quando minutos = 0, senão "2h05". Útil para cards. */
export function formatMinutesShort(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) return `${sign}${hours}h00`;
  return `${sign}${hours}h${minutes.toString().padStart(2, "0")}`;
}

/** Converte "HH:MM" em minutos desde 00:00. */
export function parseHHMMToMinutes(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) throw new Error(`Horário inválido: ${hhmm}`);
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error(`Horário inválido: ${hhmm}`);
  return h * 60 + m;
}

/**
 * Calcula a duração em minutos entre hora inicial e final (mesmo dia).
 * Lança erro se a hora final for anterior ou igual à inicial.
 */
export function calcDurationMinutes(startTime: string, endTime: string): number {
  const start = parseHHMMToMinutes(startTime);
  const end = parseHHMMToMinutes(endTime);
  const duration = end - start;
  if (duration <= 0) {
    throw new Error("A hora final deve ser posterior à hora inicial.");
  }
  return duration;
}

export function minutesToHoursDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
