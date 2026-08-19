import { db } from "@/db/client";
import { requests } from "@/db/schema";
import { like } from "drizzle-orm";

/**
 * Gera o próximo número de solicitação no formato #AAAA-NNN, sequencial
 * dentro do ano corrente. Ex.: #2026-034
 */
export async function generateNextRequestNumber(year: number = new Date().getFullYear()): Promise<string> {
  const prefix = `#${year}-`;
  const rows = await db
    .select({ number: requests.number })
    .from(requests)
    .where(like(requests.number, `${prefix}%`));

  let max = 0;
  for (const row of rows) {
    const suffix = row.number.slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  const next = max + 1;
  return `${prefix}${next.toString().padStart(3, "0")}`;
}
