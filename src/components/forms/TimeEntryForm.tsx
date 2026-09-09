"use client";

import { useActionState, useState } from "react";
import { createTimeEntry } from "@/app/actions/entries";
import type { ActionResult } from "@/app/actions/requests";
import { TimeEntryFields, EntryErrorBox } from "./TimeEntryFields";

export function TimeEntryForm({ requestId }: { requestId: number }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createTimeEntry, null);

  // Após um cadastro bem-sucedido, remonta os campos (via key) para limpar o
  // formulário — comparando com o estado já visto, sem usar useEffect.
  const [resetKey, setResetKey] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setResetKey((k) => k + 1);
  }

  return (
    <form
      action={formAction}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--page-plane)] p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="requestId" value={requestId} />

      {state && !state.ok && <EntryErrorBox message={state.error} />}

      <TimeEntryFields key={resetKey} />

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--series-1)] text-white text-[13.5px] font-medium px-4 py-2 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Adicionar apontamento"}
        </button>
      </div>
    </form>
  );
}
