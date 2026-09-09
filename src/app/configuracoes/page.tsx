import Link from "next/link";
import { getActiveContract } from "@/lib/queries";
import { Panel } from "@/components/ui/StatCard";
import { ClientForm } from "@/components/forms/ClientForm";
import { ContractForm } from "@/components/forms/ContractForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const contract = await getActiveContract();

  if (!contract) {
    return (
      <p className="text-[14px] text-[var(--text-secondary)]">
        Nenhum cliente cadastrado ainda.{" "}
        <Link href="/clientes" className="text-[var(--series-1)] font-medium">
          Cadastrar cliente →
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Configurações</h1>
      <p className="text-[13px] text-[var(--text-secondary)] -mt-3">
        Editando o cliente e contrato selecionados no momento ({contract.client.name}). Para cadastrar ou trocar de
        cliente, use a página <Link href="/clientes" className="text-[var(--series-1)] font-medium">Clientes</Link>.
      </p>

      <Panel title="Cliente / Contratante">
        <ClientForm
          clientId={contract.client.id}
          name={contract.client.name}
          cnpj={contract.client.cnpj}
          email={contract.client.email}
          phone={contract.client.phone}
          notes={contract.client.notes}
        />
      </Panel>

      <Panel title="Contrato — franquia e fechamento">
        <ContractForm
          contractId={contract.id}
          hoursPerPeriodMinutes={contract.hoursPerPeriodMinutes}
          closingDay={contract.closingDay}
          monthlyValueCents={contract.monthlyValueCents}
          overtimeHourValueCents={contract.overtimeHourValueCents}
        />
      </Panel>
    </div>
  );
}
