"use client";

import { useActionState, useState } from "react";
import { updateTimeEntry } from "@/app/actions/entries";
import type { ActionResult } from "@/app/actions/requests";
import type { TimeEntryRow } from "@/lib/queries";
import { formatMinutesShort } from "@/lib/time";
import { TimeEntryFields, EntryErrorBox } from "./TimeEntryFields";
import { DeleteEntryButton } from "./DeleteButtons";

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function EntryRow({ entry, requestId }: { entry: TimeEntryRow; requestId: number }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateTimeEntry.bind(null, entry.id, requestId),
    null
  );

  // Fecha o formulário quando a edição é salva — comparando com o estado já
  // visto, sem useEffect (evita render em cascata).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setEditing(false);
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="py-3 px-4 sm:px-2">
          <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--page-plane)] p-4">
            <div className="text-[12px] font-medium text-[var(--text-secondary)]">Editando apontamento</div>
            {state && !state.ok && <EntryErrorBox message={state.error} />}
            <TimeEntryFields
              defaults={{
                date: entry.date,
                activityType: entry.activityType,
                startTime: entry.startTime,
                endTime: entry.endTime,
                durationMinutes: entry.durationMinutes,
                description: entry.description,
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-[var(--series-1)] text-white text-[13px] font-medium px-4 py-2 disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-[var(--border-hairline)] text-[13px] font-medium px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--border-hairline)] last:border-0">
      <td className="py-2.5 px-4 sm:px-2 whitespace-nowrap align-top">{formatDatePt(entry.date)}</td>
      <td className="py-2.5 px-2 whitespace-nowrap align-top">{entry.activityType}</td>
      <td className="py-2.5 px-2 whitespace-nowrap text-[var(--text-secondary)] align-top">
        {entry.startTime && entry.endTime ? `${entry.startTime} → ${entry.endTime}` : "—"}
      </td>
      <td className="py-2.5 px-2 text-[var(--text-secondary)] align-top max-w-[280px] break-words">
        {entry.description || "—"}
      </td>
      <td className="py-2.5 px-2 text-right font-medium whitespace-nowrap align-top">
        {formatMinutesShort(entry.durationMinutes)}
      </td>
      <td className="py-2.5 px-2 text-right whitespace-nowrap align-top">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] text-[var(--series-1)] font-medium mr-3"
        >
          Editar
        </button>
        <DeleteEntryButton entryId={entry.id} requestId={requestId} />
      </td>
    </tr>
  );
}
