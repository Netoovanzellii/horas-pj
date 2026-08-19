import { notFound } from "next/navigation";
import { getActiveContract, getPeriodSummary, getTimeEntriesForRequest } from "@/lib/queries";
import { getPeriodForDate, formatPeriodLabel } from "@/lib/period";
import { formatMinutesShort } from "@/lib/time";
import { StatCard, Panel } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { ClosePeriodButton, PrintButton } from "@/components/forms/PeriodActions";
import Link from "next/link";

export default async function PeriodoDetailPage({ params }: { params: Promise<{ start: string }> }) {
  const { start } = await params;
  const contract = await getActiveContract();
  if (!contract) notFound();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) notFound();

  const period = getPeriodForDate(start, contract.closingDay);
  if (period.start !== start) notFound();

  const summary = await getPeriodSummary(contract, period);
  const overage = summary.balance.overageMinutes > 0;

  const requestsSorted = [...summary.requests].sort((a, b) => a.openedAt.localeCompare(b.openedAt));

  const entriesByRequest = new Map(
    await Promise.all(
      requestsSorted.map(async (r) => {
        const all = await getTimeEntriesForRequest(r.id);
        return [r.id, all.filter((e) => e.date >= period.start && e.date < period.end)] as const;
      })
    )
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/periodos" className="text-[12.5px] text-[var(--series-1)] font-medium">
            ← Períodos
          </Link>
          <h1 className="text-xl font-semibold mt-1">Fechamento — {formatPeriodLabel(period)}</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{contract.client.name}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <PrintButton />
          <ClosePeriodButton contractId={contract.id} period={period} closed={summary.closed} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Horas contratadas" value={formatMinutesShort(summary.balance.contractedMinutes)} />
        <StatCard label="Horas utilizadas" value={formatMinutesShort(summary.balance.usedMinutes)} />
        {overage ? (
          <StatCard label="Horas excedentes" value={formatMinutesShort(summary.balance.overageMinutes)} tone="critical" />
        ) : (
          <StatCard label="Saldo disponível" value={formatMinutesShort(summary.balance.availableMinutes)} tone="good" />
        )}
        <StatCard label="Status do fechamento" value={summary.closed ? "Fechado" : "Aberto"} />
      </div>

      <Panel title={`Solicitações do período (${requestsSorted.length})`}>
        {requestsSorted.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)]">Nenhuma solicitação com apontamentos neste período.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-[13.5px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[12px] text-[var(--text-muted)] border-b border-[var(--border-hairline)]">
                  <th className="py-2 px-4 sm:px-2 font-medium">Número</th>
                  <th className="py-2 px-2 font-medium">Descrição</th>
                  <th className="py-2 px-2 font-medium">Solicitante</th>
                  <th className="py-2 px-2 font-medium">Data inicial</th>
                  <th className="py-2 px-2 font-medium">Data final</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                  <th className="py-2 px-2 font-medium text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {requestsSorted.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-hairline)] last:border-0">
                    <td className="py-2.5 px-4 sm:px-2 whitespace-nowrap">
                      <Link href={`/solicitacoes/${r.id}`} className="text-[var(--series-1)] font-medium">
                        {r.number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 max-w-[240px] truncate">{r.title}</td>
                    <td className="py-2.5 px-2 text-[var(--text-secondary)]">{r.requester || "—"}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap">{formatDatePt(r.openedAt)}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap">{r.completedAt ? formatDatePt(r.completedAt) : "—"}</td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium whitespace-nowrap">{formatMinutesShort(r.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Detalhamento dos apontamentos">
        <div className="flex flex-col gap-5">
          {requestsSorted.map((r) => {
            const allEntries = entriesByRequest.get(r.id) ?? [];
            if (allEntries.length === 0) return null;
            return (
              <div key={r.id}>
                <div className="text-[13.5px] font-medium mb-2">
                  <span className="text-[var(--text-muted)] font-normal mr-1.5">{r.number}</span>
                  {r.title}
                </div>
                <table className="w-full text-[13px] mb-1">
                  <thead>
                    <tr className="text-left text-[11.5px] text-[var(--text-muted)] border-b border-[var(--border-hairline)]">
                      <th className="py-1.5 font-medium">Data</th>
                      <th className="py-1.5 font-medium">Tipo</th>
                      <th className="py-1.5 font-medium">Horário</th>
                      <th className="py-1.5 font-medium">Descrição</th>
                      <th className="py-1.5 font-medium text-right">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEntries.map((e) => (
                      <tr key={e.id} className="border-b border-[var(--border-hairline)] last:border-0">
                        <td className="py-1.5 whitespace-nowrap">{formatDatePt(e.date)}</td>
                        <td className="py-1.5 whitespace-nowrap">{e.activityType}</td>
                        <td className="py-1.5 whitespace-nowrap text-[var(--text-secondary)]">
                          {e.startTime && e.endTime ? `${e.startTime} → ${e.endTime}` : "—"}
                        </td>
                        <td className="py-1.5 text-[var(--text-secondary)]">{e.description || "—"}</td>
                        <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatMinutesShort(e.durationMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
