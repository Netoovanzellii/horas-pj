import Link from "next/link";
import { getActiveContract, getAllRequestsForContract, getAllTimeEntriesForRequests } from "@/lib/queries";
import { formatMinutesShort } from "@/lib/time";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/StatCard";

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const contract = await getActiveContract();

  if (!contract) {
    return (
      <p className="text-[14px] text-[var(--text-secondary)]">
        Cadastre um cliente antes de criar solicitações.{" "}
        <Link href="/clientes" className="text-[var(--series-1)] font-medium">
          Cadastrar cliente →
        </Link>
      </p>
    );
  }

  const allRequests = await getAllRequestsForContract(contract.id);
  const entries = await getAllTimeEntriesForRequests(allRequests.map((r) => r.id));
  const totalsByRequest = new Map<number, number>();
  for (const e of entries) {
    totalsByRequest.set(e.requestId, (totalsByRequest.get(e.requestId) ?? 0) + e.durationMinutes);
  }

  let filtered = [...allRequests].sort((a, b) => b.openedAt.localeCompare(a.openedAt) || b.number.localeCompare(a.number));

  if (params.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (r) => r.title.toLowerCase().includes(q) || r.number.toLowerCase().includes(q) || (r.requester ?? "").toLowerCase().includes(q)
    );
  }

  const statuses = ["Aberta", "Em análise", "Em andamento", "Aguardando retorno", "Concluída", "Cancelada"];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Solicitações</h1>
        <Link
          href="/solicitacoes/nova"
          className="rounded-md bg-[var(--series-1)] text-white text-[13.5px] font-medium px-3.5 py-2"
        >
          + Nova solicitação
        </Link>
      </div>

      <form className="flex flex-col sm:flex-row gap-3" action="/solicitacoes">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por número, título ou solicitante"
          className="flex-1 rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--series-1)]"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[13.5px]"
        >
          <option value="">Todos os status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-[var(--border-hairline)] px-3.5 py-2 text-[13.5px] font-medium">
          Filtrar
        </button>
      </form>

      <Panel>
        {filtered.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)] py-2">Nenhuma solicitação encontrada.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-[13.5px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[12px] text-[var(--text-muted)] border-b border-[var(--border-hairline)]">
                  <th className="py-2 px-4 sm:px-2 font-medium">Número</th>
                  <th className="py-2 px-2 font-medium">Título</th>
                  <th className="py-2 px-2 font-medium">Solicitante</th>
                  <th className="py-2 px-2 font-medium">Prioridade</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                  <th className="py-2 px-2 font-medium text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--page-plane)]">
                    <td className="py-2.5 px-4 sm:px-2">
                      <Link href={`/solicitacoes/${r.id}`} className="text-[var(--series-1)] font-medium">
                        {r.number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 max-w-[280px] truncate">
                      <Link href={`/solicitacoes/${r.id}`}>{r.title}</Link>
                    </td>
                    <td className="py-2.5 px-2 text-[var(--text-secondary)]">{r.requester || "—"}</td>
                    <td className="py-2.5 px-2">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium">
                      {formatMinutesShort(totalsByRequest.get(r.id) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
