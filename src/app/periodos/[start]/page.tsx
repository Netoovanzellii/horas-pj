import { notFound } from "next/navigation";
import { getActiveContract, getPeriodSummary, getTimeEntriesForRequest } from "@/lib/queries";
import { getPeriodForDate, formatPeriodLabel } from "@/lib/period";
import { formatMinutesShort } from "@/lib/time";
import { StatCard, Panel } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { ClosePeriodButton, PrintButton } from "@/components/forms/PeriodActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatBRL(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Rótulo do período pelo mês em que ele começa: "Período de agosto de 2026". */
function formatPeriodMonthLabel(startISO: string): string {
  const [y, m] = startISO.split("-").map(Number);
  return `Período de ${MESES[m - 1]} de ${y}`;
}

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

  const generatedAt = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const entriesByRequest = new Map(
    await Promise.all(
      requestsSorted.map(async (r) => {
        const all = await getTimeEntriesForRequest(r.id);
        return [r.id, all.filter((e) => e.date >= period.start && e.date < period.end)] as const;
      })
    )
  );

  const totalEntriesMinutes = requestsSorted.reduce(
    (sum, r) => sum + (entriesByRequest.get(r.id) ?? []).reduce((s, e) => s + e.durationMinutes, 0),
    0
  );

  const monthlyValue = formatBRL(contract.monthlyValueCents);
  const overtimeRate = formatBRL(contract.overtimeHourValueCents);
  const overageCostCents =
    overage && contract.overtimeHourValueCents != null
      ? Math.round((summary.balance.overageMinutes / 60) * contract.overtimeHourValueCents)
      : null;
  const overageCost = formatBRL(overageCostCents);

  const balanceLabel = overage ? "Horas excedentes" : "Saldo disponível";
  const balanceValue = formatMinutesShort(overage ? summary.balance.overageMinutes : summary.balance.availableMinutes);

  return (
    <div className="flex flex-col gap-5 print:gap-0 print:text-[#1a1a1a]">
      {/* ---------- Cabeçalho (tela) ---------- */}
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <Link href="/periodos" className="text-[12.5px] text-[var(--series-1)] font-medium">
            ← Períodos
          </Link>
          <h1 className="text-xl font-semibold mt-1">Fechamento — {formatPeriodLabel(period)}</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            {contract.client.name}
            {contract.client.cnpj ? ` · CNPJ ${contract.client.cnpj}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton start={period.start} />
          <ClosePeriodButton contractId={contract.id} period={period} closed={summary.closed} />
        </div>
      </div>

      {/* ---------- Papel timbrado (impressão) ---------- */}
      <header className="hidden print:block report-letterhead">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[9pt] tracking-[0.14em] uppercase text-[var(--series-1-strong)] font-semibold">
              Relatório de fechamento de período
            </div>
            <div className="text-[17pt] font-semibold leading-tight mt-1">{formatPeriodMonthLabel(period.start)}</div>
          </div>
          <div className="text-right text-[9pt] leading-snug">
            <div className="font-semibold text-[10pt]">{contract.client.name}</div>
            {contract.client.cnpj && <div>CNPJ {contract.client.cnpj}</div>}
            {contract.client.email && <div>{contract.client.email}</div>}
          </div>
        </div>
        <div className="text-[8.5pt] text-black/55 mt-2">
          Documento gerado em {generatedAt} · Status do fechamento: {summary.closed ? "Fechado" : "Aberto"}
        </div>
      </header>

      {/* ---------- Resumo (tela: cards) ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        <StatCard label="Horas contratadas" value={formatMinutesShort(summary.balance.contractedMinutes)} />
        <StatCard label="Horas utilizadas" value={formatMinutesShort(summary.balance.usedMinutes)} />
        <StatCard label={balanceLabel} value={balanceValue} tone={overage ? "critical" : "good"} />
        <StatCard label="% da franquia utilizado" value={`${summary.balance.percentUsed}%`} />
      </div>

      {/* ---------- Resumo (impressão: tabela) ---------- */}
      <section className="hidden print:block report-section">
        <h2 className="report-h2">Resumo do período</h2>
        <table className="report-kv">
          <tbody>
            <tr>
              <th>Período de apuração</th>
              <td>{formatPeriodLabel(period)}</td>
              <th>Dia de fechamento</th>
              <td>Dia {contract.closingDay}</td>
            </tr>
            <tr>
              <th>Horas contratadas</th>
              <td>{formatMinutesShort(summary.balance.contractedMinutes)}</td>
              <th>Horas utilizadas</th>
              <td>{formatMinutesShort(summary.balance.usedMinutes)}</td>
            </tr>
            <tr>
              <th>{balanceLabel}</th>
              <td className={overage ? "text-[var(--status-critical)] font-semibold" : "font-semibold"}>{balanceValue}</td>
              <th>% da franquia utilizado</th>
              <td>{summary.balance.percentUsed}%</td>
            </tr>
            {(monthlyValue || overtimeRate) && (
              <tr>
                <th>Valor mensal</th>
                <td>{monthlyValue ?? "—"}</td>
                <th>Hora excedente</th>
                <td>{overtimeRate ?? "—"}</td>
              </tr>
            )}
            {overageCost && (
              <tr>
                <th>Estimativa de excedente</th>
                <td colSpan={3} className="font-semibold text-[var(--status-critical)]">
                  {formatMinutesShort(summary.balance.overageMinutes)} × {overtimeRate} = {overageCost}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ---------- Solicitações do período ---------- */}
      <Panel title={`Solicitações do período (${requestsSorted.length})`}>
        {requestsSorted.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)]">Nenhuma solicitação com apontamentos neste período.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 print:overflow-visible print:mx-0">
            <table className="w-full table-fixed text-[13.5px] min-w-[720px] print:min-w-0 print:text-[9pt] report-table">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr className="text-left text-[12px] text-[var(--text-muted)] border-b border-[var(--border-hairline)] print:text-[8pt]">
                  <th className="py-2 px-2 font-medium">Número</th>
                  <th className="py-2 px-2 font-medium">Descrição</th>
                  <th className="py-2 px-2 font-medium">Solicitante</th>
                  <th className="py-2 px-2 font-medium">Abertura</th>
                  <th className="py-2 px-2 font-medium">Conclusão</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                  <th className="py-2 px-2 font-medium text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {requestsSorted.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--border-hairline)] last:border-0 print:break-inside-avoid"
                  >
                    <td className="py-2.5 px-2 align-top whitespace-nowrap">
                      <Link href={`/solicitacoes/${r.id}`} className="text-[var(--series-1)] font-medium">
                        {r.number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 align-top break-words">{r.title}</td>
                    <td className="py-2.5 px-2 align-top break-words text-[var(--text-secondary)]">
                      {r.requester || "—"}
                    </td>
                    <td className="py-2.5 px-2 align-top whitespace-nowrap">{formatDatePt(r.openedAt)}</td>
                    <td className="py-2.5 px-2 align-top whitespace-nowrap">
                      {r.completedAt ? formatDatePt(r.completedAt) : "—"}
                    </td>
                    <td className="py-2.5 px-2 align-top">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-2 align-top text-right font-medium whitespace-nowrap">
                      {formatMinutesShort(r.totalMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--text-muted)]/40 font-semibold">
                  <td className="py-2 px-2" colSpan={6}>
                    Total de horas no período
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--series-1-strong)] whitespace-nowrap">
                    {formatMinutesShort(totalEntriesMinutes)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* ---------- Detalhamento dos apontamentos ---------- */}
      {totalEntriesMinutes > 0 && (
        <Panel title="Detalhamento dos apontamentos">
          <div className="flex flex-col gap-5 print:gap-3">
            {requestsSorted.map((r) => {
              const allEntries = entriesByRequest.get(r.id) ?? [];
              if (allEntries.length === 0) return null;
              const subtotal = allEntries.reduce((s, e) => s + e.durationMinutes, 0);
              return (
                <div key={r.id}>
                  <div className="text-[13.5px] font-medium mb-2 print:text-[9.5pt] print:mb-1 print:break-after-avoid">
                    <span className="text-[var(--text-muted)] font-normal mr-1.5">{r.number}</span>
                    {r.title}
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0 print:overflow-visible print:mx-0">
                    <table className="w-full table-fixed text-[13px] min-w-[620px] print:min-w-0 print:text-[9pt] report-table">
                      <colgroup>
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                        <tr className="text-left text-[11.5px] text-[var(--text-muted)] border-b border-[var(--border-hairline)] print:text-[8pt]">
                          <th className="py-1.5 px-2 font-medium">Data</th>
                          <th className="py-1.5 px-2 font-medium">Tipo</th>
                          <th className="py-1.5 px-2 font-medium">Horário</th>
                          <th className="py-1.5 px-2 font-medium">Descrição</th>
                          <th className="py-1.5 px-2 font-medium text-right">Duração</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEntries.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-[var(--border-hairline)] last:border-0 print:break-inside-avoid"
                          >
                            <td className="py-1.5 px-2 align-top whitespace-nowrap">{formatDatePt(e.date)}</td>
                            <td className="py-1.5 px-2 align-top whitespace-nowrap">{e.activityType}</td>
                            <td className="py-1.5 px-2 align-top whitespace-nowrap text-[var(--text-secondary)]">
                              {e.startTime && e.endTime ? `${e.startTime} → ${e.endTime}` : "—"}
                            </td>
                            <td className="py-1.5 px-2 align-top break-words text-[var(--text-secondary)] print:text-[#333]">
                              {e.description || "—"}
                            </td>
                            <td className="py-1.5 px-2 align-top text-right font-medium whitespace-nowrap">
                              {formatMinutesShort(e.durationMinutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="py-1.5 px-2" colSpan={4}>
                            Subtotal {r.number}
                          </td>
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">{formatMinutesShort(subtotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between border-t border-[var(--text-muted)]/40 pt-2 text-[13.5px] font-semibold print:text-[9.5pt]">
              <span>Total geral de horas apontadas no período</span>
              <span className="text-[var(--series-1-strong)]">{formatMinutesShort(totalEntriesMinutes)}</span>
            </div>
          </div>
        </Panel>
      )}

      {/* ---------- Rodapé (impressão) ---------- */}
      <footer className="hidden print:block report-footer">
        Franquia contratada: {formatMinutesShort(contract.hoursPerPeriodMinutes)} por período · fechamento no dia{" "}
        {contract.closingDay}
        {monthlyValue ? ` · valor mensal ${monthlyValue}` : ""}. Relatório gerado eletronicamente pelo sistema de
        Controle de Horas em {generatedAt}.
      </footer>
    </div>
  );
}
