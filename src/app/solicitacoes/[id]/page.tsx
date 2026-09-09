import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequestById, getTimeEntriesForRequest } from "@/lib/queries";
import { formatMinutesShort } from "@/lib/time";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/StatCard";
import { TimeEntryForm } from "@/components/forms/TimeEntryForm";
import { EntryRow } from "@/components/forms/EntryRow";
import { DeleteRequestButton } from "@/components/forms/DeleteButtons";

export default async function SolicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = Number(id);
  const request = await getRequestById(requestId);
  if (!request) notFound();

  const entries = await getTimeEntriesForRequest(requestId);
  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[12.5px] text-[var(--text-muted)] mb-1">{request.number}</div>
          <h1 className="text-xl font-semibold">{request.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/solicitacoes/${requestId}/editar`} className="text-[13.5px] font-medium text-[var(--series-1)]">
            Editar
          </Link>
          <DeleteRequestButton requestId={requestId} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel title="Solicitante">
          <p className="text-[14px]">{request.requester || "—"}</p>
        </Panel>
        <Panel title="Abertura">
          <p className="text-[14px]">{formatDatePt(request.openedAt)}</p>
        </Panel>
        <Panel title="Início / Conclusão">
          <p className="text-[14px]">
            {request.startedAt ? formatDatePt(request.startedAt) : "—"} → {request.completedAt ? formatDatePt(request.completedAt) : "—"}
          </p>
        </Panel>
        <Panel title="Total de horas utilizadas">
          <p className="text-[20px] font-semibold text-[var(--series-1)]">{formatMinutesShort(totalMinutes)}</p>
        </Panel>
      </div>

      {(request.description || request.notes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {request.description && (
            <Panel title="Descrição">
              <p className="text-[13.5px] text-[var(--text-secondary)] whitespace-pre-wrap">{request.description}</p>
            </Panel>
          )}
          {request.notes && (
            <Panel title="Observações">
              <p className="text-[13.5px] text-[var(--text-secondary)] whitespace-pre-wrap">{request.notes}</p>
            </Panel>
          )}
        </div>
      )}

      <Panel title="Adicionar apontamento">
        <TimeEntryForm requestId={requestId} />
      </Panel>

      <Panel title={`Apontamentos (${entries.length})`}>
        {entries.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-secondary)]">Nenhum apontamento registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-[13.5px] min-w-[560px]">
              <thead>
                <tr className="text-left text-[12px] text-[var(--text-muted)] border-b border-[var(--border-hairline)]">
                  <th className="py-2 px-4 sm:px-2 font-medium">Data</th>
                  <th className="py-2 px-2 font-medium">Tipo</th>
                  <th className="py-2 px-2 font-medium">Horário</th>
                  <th className="py-2 px-2 font-medium">Descrição</th>
                  <th className="py-2 px-2 font-medium text-right">Duração</th>
                  <th className="py-2 px-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <EntryRow key={e.id} entry={e} requestId={requestId} />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 sm:px-2 text-right font-medium">
                    Total da solicitação
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-[var(--series-1)]">{formatMinutesShort(totalMinutes)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
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
