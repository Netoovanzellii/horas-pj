"use client";

import { useTransition } from "react";
import { deleteTimeEntry } from "@/app/actions/entries";
import { deleteRequest } from "@/app/actions/requests";

export function DeleteEntryButton({ entryId, requestId }: { entryId: number; requestId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir este apontamento?")) {
          startTransition(() => {
            deleteTimeEntry(entryId, requestId);
          });
        }
      }}
      className="text-[12px] text-[var(--status-critical)] font-medium disabled:opacity-50"
    >
      Excluir
    </button>
  );
}

export function DeleteRequestButton({ requestId }: { requestId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir esta solicitação e todos os seus apontamentos? Esta ação não pode ser desfeita.")) {
          startTransition(() => {
            deleteRequest(requestId);
          });
        }
      }}
      className="text-[13px] text-[var(--status-critical)] font-medium disabled:opacity-50"
    >
      Excluir solicitação
    </button>
  );
}
