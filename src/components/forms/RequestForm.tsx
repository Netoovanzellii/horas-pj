"use client";

import { useActionState } from "react";
import { REQUEST_STATUSES, REQUEST_PRIORITIES } from "@/db/schema";
import type { ActionResult } from "@/app/actions/requests";

const inputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
const labelCls = "block text-[12.5px] font-medium text-[var(--text-secondary)] mb-1";

export interface RequestFormDefaults {
  title?: string;
  description?: string;
  requester?: string;
  openedAt?: string;
  startedAt?: string;
  completedAt?: string;
  status?: string;
  priority?: string;
  notes?: string;
}

export function RequestForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults?: RequestFormDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      {state && !state.ok && (
        <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13.5px] px-3 py-2">
          {state.error}
        </div>
      )}
      {state && state.ok && (
        <div className="rounded-md bg-[#dcf3dc] border border-[#b9e0b9] text-[#0a6b0a] text-[13.5px] px-3 py-2">
          Alterações salvas.
        </div>
      )}

      <div>
        <label className={labelCls}>Título *</label>
        <input name="title" defaultValue={defaults?.title} required className={inputCls} placeholder="Ex.: Ajustar relatório de vendas" />
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea name="description" defaultValue={defaults?.description} rows={3} className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Solicitante</label>
          <input name="requester" defaultValue={defaults?.requester} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data de abertura *</label>
          <input
            type="date"
            name="openedAt"
            defaultValue={defaults?.openedAt ?? new Date().toISOString().slice(0, 10)}
            required
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Data de início</label>
          <input type="date" name="startedAt" defaultValue={defaults?.startedAt} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data de conclusão</label>
          <input type="date" name="completedAt" defaultValue={defaults?.completedAt} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Status</label>
          <select name="status" defaultValue={defaults?.status ?? "Aberta"} className={inputCls}>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Prioridade</label>
          <select name="priority" defaultValue={defaults?.priority ?? "Média"} className={inputCls}>
            {REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Observações</label>
        <textarea name="notes" defaultValue={defaults?.notes} rows={2} className={inputCls} />
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--series-1)] text-white text-[14px] font-medium px-4 py-2 disabled:opacity-60"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
