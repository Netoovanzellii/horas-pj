import Link from "next/link";
import { getActiveContract, getPeriodSummary } from "@/lib/queries";
import { getCurrentPeriod, formatPeriodLabel, todayISO } from "@/lib/period";
import { formatMinutesShort } from "@/lib/time";
import { StatCard, Panel } from "@/components/ui/StatCard";
import { Meter } from "@/components/ui/Meter";
import { UsageChart } from "@/components/UsageChart";
import { buildUsageSeries } from "@/lib/series";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const contract = await getActiveContract();

  if (!contract) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-2">Nenhum contrato configurado</h1>
        <p className="text-[var(--text-secondary)] text-[14px] mb-4">
          Cadastre o cliente e o contrato para começar a usar o sistema.
        </p>
        <Link href="/configuracoes" className="text-[var(--series-1)] font-medium text-[14px]">
          Ir para Configurações →
        </Link>
      </div>
    );
  }

  const period = getCurrentPeriod(contract.closingDay);
  const summary = await getPeriodSummary(contract, period);
  const { balance } = summary;
  const overage = balance.overageMinutes > 0;

  const points = buildUsageSeries(summary.entries, period, todayISO());

  const recentRequests = [...summary.requests]
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{contract.client.name}</p>
        </div>
        <div className="text-[13px] text-[var(--text-secondary)] sm:text-right space-y-0.5">
          <div>
            Período atual: <span className="font-medium text-[var(--text-primary)]">{formatPeriodLabel(period)}</span>
          </div>
          <div>
            Início: <span className="font-medium text-[var(--text-primary)]">{formatDatePt(period.start)}</span>
            {"  ·  "}
            Encerramento: <span className="font-medium text-[var(--text-primary)]">{formatDatePt(period.end)}</span>
          </div>
          <div>
            Próximo fechamento: <span className="font-medium text-[var(--text-primary)]">{formatDatePt(period.end)}</span>
          </div>
        </div>
      </div>

      {overage && (
        <div className="rounded-lg border border-[#f0c9c9] bg-[#fdf1f1] px-4 py-3 text-[13.5px] text-[#8a2c2c]">
          Atenção: a franquia do período foi ultrapassada em {formatMinutesShort(balance.overageMinutes)}.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Horas contratadas" value={formatMinutesShort(balance.contractedMinutes)} />
        <StatCard label="Horas utilizadas" value={formatMinutesShort(balance.usedMinutes)} />
        {overage ? (
          <StatCard label="Horas excedentes" value={formatMinutesShort(balance.overageMinutes)} tone="critical" />
        ) : (
          <StatCard label="Horas disponíveis" value={formatMinutesShort(balance.availableMinutes)} tone="good" />
        )}
        <StatCard
          label="% da franquia utilizada"
          value={`${balance.percentUsed.toLocaleString("pt-BR")}%`}
          tone={overage ? "critical" : balance.percentUsed >= 85 ? "warning" : "neutral"}
        />
      </div>

      <Panel title="Utilização da franquia">
        <Meter percent={balance.percentUsed} overage={overage} />
        <div className="flex justify-between text-[12.5px] text-[var(--text-muted)] mt-2">
          <span>0h</span>
          <span>{formatMinutesShort(balance.contractedMinutes)}</span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="Utilização de horas no período">
            <UsageChart points={points} contractedMinutes={balance.contractedMinutes} />
          </Panel>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <StatCard label="Solicitações no período" value={String(summary.requestCount)} />
          <StatCard label="Concluídas" value={String(summary.completedCount)} tone="good" />
          <StatCard label="Em andamento" value={String(summary.inProgressCount)} />
        </div>
      </div>

      <Panel
        title="Solicitações recentes"
        action={
          <Link href="/solicitacoes" className="text-[13px] font-medium text-[var(--series-1)]">
            Ver todas →
          </Link>
        }
      >
        {recentRequests.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)]">Nenhuma solicitação neste período ainda.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border-hairline)]">
            {recentRequests.map((r) => (
              <Link
                key={r.id}
                href={`/solicitacoes/${r.id}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-[var(--page-plane)] -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium truncate">
                    <span className="text-[var(--text-muted)] font-normal mr-1.5">{r.number}</span>
                    {r.title}
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)]">{formatMinutesShort(r.totalMinutes)}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
