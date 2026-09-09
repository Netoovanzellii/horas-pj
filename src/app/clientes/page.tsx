import { getAllContractsWithClients, getActiveContract } from "@/lib/queries";
import { Panel } from "@/components/ui/StatCard";
import { NewClientForm } from "@/components/forms/NewClientForm";
import { ClientRowActions } from "@/components/forms/ClientRowActions";
import { formatMinutesShort } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [allContracts, active] = await Promise.all([getAllContractsWithClients(), getActiveContract()]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Clientes</h1>

      <Panel title={`Clientes cadastrados (${allContracts.length})`}>
        {allContracts.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)]">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border-hairline)]">
            {allContracts.map((c) => {
              const isSelected = active?.id === c.id;
              return (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-[14px] font-medium flex items-center gap-2">
                      {c.client.name}
                      {isSelected && (
                        <span className="text-[11px] rounded-full px-2 py-0.5 bg-[var(--series-1-wash)] text-[var(--series-1-strong)] font-medium">
                          Selecionado
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                      {formatMinutesShort(c.hoursPerPeriodMinutes)} / período · fechamento dia {c.closingDay} ·{" "}
                      <span className={c.status === "ativo" ? "text-[var(--status-good)]" : "text-[var(--text-muted)]"}>
                        {c.status === "ativo" ? "Ativo" : "Encerrado"}
                      </span>
                    </div>
                  </div>
                  <ClientRowActions contractId={c.id} status={c.status} isSelected={isSelected} />
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Novo cliente">
        <NewClientForm />
      </Panel>
    </div>
  );
}
