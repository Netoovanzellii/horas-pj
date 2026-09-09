import { notFound } from "next/navigation";
import { getRequestById } from "@/lib/queries";
import { RequestForm } from "@/components/forms/RequestForm";
import { updateRequest } from "@/app/actions/requests";

export default async function EditarSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = Number(id);
  const request = await getRequestById(requestId);
  if (!request) notFound();

  const boundAction = updateRequest.bind(null, requestId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[12.5px] text-[var(--text-muted)] mb-1">{request.number}</div>
        <h1 className="text-xl font-semibold">Editar solicitação</h1>
      </div>
      <RequestForm
        action={boundAction}
        submitLabel="Salvar alterações"
        defaults={{
          title: request.title,
          description: request.description ?? undefined,
          requester: request.requester ?? undefined,
          openedAt: request.openedAt,
          startedAt: request.startedAt ?? undefined,
          completedAt: request.completedAt ?? undefined,
          status: request.status,
          priority: request.priority,
          notes: request.notes ?? undefined,
        }}
      />
    </div>
  );
}
