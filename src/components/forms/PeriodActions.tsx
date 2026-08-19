"use client";

import { useTransition } from "react";
import { closePeriodAction, reopenPeriodAction } from "@/app/actions/periods";
import type { Period } from "@/lib/period";

export function ClosePeriodButton({ contractId, period, closed }: { contractId: number; period: Period; closed: boolean }) {
  const [pending, startTransition] = useTransition();

  if (closed) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => reopenPeriodAction(contractId, period))}
        className="rounded-md border border-[var(--border-hairline)] text-[13.5px] font-medium px-3.5 py-2 disabled:opacity-50"
      >
        Reabrir período
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Fechar este período? Você poderá reabri-lo depois, se precisar.")) {
          startTransition(() => closePeriodAction(contractId, period));
        }
      }}
      className="rounded-md bg-[var(--series-1)] text-white text-[13.5px] font-medium px-3.5 py-2 disabled:opacity-50"
    >
      Fechar período
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-[var(--border-hairline)] text-[13.5px] font-medium px-3.5 py-2 print:hidden"
    >
      Gerar relatório (imprimir / PDF)
    </button>
  );
}
