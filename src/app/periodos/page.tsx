import Link from "next/link";
import { getActiveContract, getPeriodSummary } from "@/lib/queries";
import { listPeriodsSince, formatPeriodLabel } from "@/lib/period";
import { formatMinutesShort } from "@/lib/time";
import { StatCard } from "@/components/ui/StatCard";

export default async function PeriodosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const contract = await getActiveContract();

  if (!contract) {
    return (
      <p className="text-[14px] text-[var(--text-secondary)]">
        Cadastre um cliente antes de consultar períodos.{" "}
        <Link href="/clientes" className="text-[var(--series-1)] font-medium">
          Cadastrar cliente →
        </Link>
      </p>
    );
  }

  const periods = listPeriodsSince(contract.startDate, contract.closingDay).reverse();
  const summaries = await Promise.all(periods.map((p) => getPeriodSummary(contract, p)));

  const filtered =
    params.status === "aberto"
      ? summaries.filter((s) => !s.closed)
      : params.status === "fechado"
      ? summaries.filter((s) => s.closed)
      : summaries;

  const totals = summaries.reduce(
    (acc, s) => {
      acc.contracted += s.balance.contractedMinutes;
      acc.used += s.balance.usedMinutes;
      acc.overage += s.balance.overageMinutes;
      acc.requestCount += s.requestCount;
      return acc;
    },
    { contracted: 0, used: 0, overage: 0, requestCount: 0 }
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Períodos e histórico</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total contratado" value={formatMinutesShort(totals.contracted)} />
        <StatCard label="Total utilizado" value={formatMinutesShort(totals.used)} />
        <StatCard label="Total excedente" value={formatMinutesShort(totals.overage)} tone={totals.overage > 0 ? "critical" : "neutral"} />
        <StatCard label="Total de solicitações" value={String(totals.requestCount)} />
      </div>

      <form className="flex gap-3" action="/periodos">
        <select name="status" defaultValue={params.status ?? ""} className="rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[13.5px]">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="fechado">Fechado</option>
        </select>
        <button type="submit" className="rounded-md border border-[var(--border-hairline)] px-3.5 py-2 text-[13.5px] font-medium">
          Filtrar
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {filtered.map((s) => {
          const overage = s.balance.overageMinutes > 0;
          return (
            <Link
              key={s.period.start}
              href={`/periodos/${s.period.start}`}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:border-[var(--series-1)] transition-colors"
            >
              <div className="flex-1">
                <div className="text-[14px] font-medium">{formatPeriodLabel(s.period)}</div>
                <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{s.requestCount} solicitação(ões)</div>
              </div>
              <div className="flex gap-6 text-[13px]">
                <div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">Contratadas</div>
                  <div className="font-medium">{formatMinutesShort(s.balance.contractedMinutes)}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">Utilizadas</div>
                  <div className="font-medium">{formatMinutesShort(s.balance.usedMinutes)}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">{overage ? "Excedentes" : "Disponíveis"}</div>
                  <div className="font-medium" style={{ color: overage ? "var(--status-critical)" : "var(--status-good)" }}>
                    {overage ? formatMinutesShort(s.balance.overageMinutes) : formatMinutesShort(s.balance.availableMinutes)}
                  </div>
                </div>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap self-start sm:self-auto"
                style={
                  s.closed
                    ? { background: "#eceae6", color: "#6b6a65" }
                    : { background: "#cde2fb", color: "#184f95" }
                }
              >
                {s.closed ? "Fechado" : "Aberto"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
