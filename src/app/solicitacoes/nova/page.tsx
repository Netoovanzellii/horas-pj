import { RequestForm } from "@/components/forms/RequestForm";
import { createRequest } from "@/app/actions/requests";

export default function NovaSolicitacaoPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Nova solicitação</h1>
      <RequestForm action={createRequest} submitLabel="Criar solicitação" />
    </div>
  );
}
