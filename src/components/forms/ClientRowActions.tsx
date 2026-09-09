"use client";

import { useTransition } from "react";
import { setActiveContractAction, toggleContractStatusAction } from "@/app/actions/contract";

export function ClientRowActions({
  contractId,
  status,
  isSelected,
}: {
  contractId: number;
  status: "ativo" | "encerrado";
  isSelected: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 print:hidden">
      {!isSelected && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setActiveContractAction(contractId))}
          className="rounded-md border border-[var(--border-hairline)] text-[12.5px] font-medium px-3 py-1.5 disabled:opacity-50"
        >
          Usar este cliente
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const confirmMsg =
            status === "ativo" ? "Encerrar o contrato deste cliente?" : "Reativar o contrato deste cliente?";
          if (confirm(confirmMsg)) {
            startTransition(() => toggleContractStatusAction(contractId, status));
          }
        }}
        className="rounded-md border border-[var(--border-hairline)] text-[12.5px] font-medium px-3 py-1.5 text-[var(--text-secondary)] disabled:opacity-50"
      >
        {status === "ativo" ? "Encerrar" : "Reativar"}
      </button>
    </div>
  );
}
