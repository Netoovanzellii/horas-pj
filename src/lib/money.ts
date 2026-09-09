/**
 * Utilitários de dinheiro. No banco os valores ficam em CENTAVOS (inteiro);
 * na interface o usuário digita e lê em REAIS, formato pt-BR.
 */

/** Centavos (inteiro) -> texto do input: 1800 -> "18,00"; null -> "". */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Centavos (inteiro) -> "R$ 1.800,00"; null -> "—". */
export function formatBRLFromCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Texto digitado (reais, pt-BR) -> centavos inteiros.
 * "" / null           -> null  (não informado)
 * texto inválido       -> NaN   (o chamador deve tratar como erro)
 * Aceita "1800", "1.800,00", "18,5", "R$ 18,00".
 */
export function parseBRLToCents(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;

  const normalized = trimmed
    .replace(/[R$\s ]/g, "") // remove "R$" e espaços
    .replace(/\./g, "") // pontos = separador de milhar
    .replace(",", "."); // vírgula = separador decimal

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return NaN;
  return Math.round(value * 100);
}
