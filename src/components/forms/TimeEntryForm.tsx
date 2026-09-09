"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { ACTIVITY_TYPES } from "@/db/schema";
import { createTimeEntry } from "@/app/actions/entries";
import type { ActionResult } from "@/app/actions/requests";

const inputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
const labelCls = "block text-[12px] font-medium text-[var(--text-secondary)] mb-1";

export function TimeEntryForm({ requestId }: { requestId: number }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createTimeEntry, null);
  const [mode, setMode] = useState<"range" | "direct">("range");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--page-plane)] p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="requestId" value={requestId} />

      {state && !state.ok && (
        <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13px] px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Data *</label>
          <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tipo *</label>
          <select name="activityType" defaultValue="Desenvolvimento" className={inputCls}>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {mode === "range" ? (
          <>
            <div>
              <label className={labelCls}>Hora inicial</label>
              <input type="time" name="startTime" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hora final</label>
              <input type="time" name="endTime" className={inputCls} />
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label className={labelCls}>Duração (minutos) *</label>
            <input type="number" min={1} name="durationMinutes" placeholder="ex.: 90" className={inputCls} />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMode((m) => (m === "range" ? "direct" : "range"))}
        className="text-[12px] text-[var(--series-1)] font-medium self-start"
      >
        {mode === "range" ? "Informar duração diretamente, sem horários →" : "← Informar horário inicial/final"}
      </button>

      <div>
        <label className={labelCls}>Descrição do que foi realizado</label>
        <textarea name="description" rows={2} className={inputCls} />
      </div>

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
