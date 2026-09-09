"use client";

import { useState } from "react";
import { ACTIVITY_TYPES } from "@/db/schema";

export const entryInputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
export const entryLabelCls = "block text-[12px] font-medium text-[var(--text-secondary)] mb-1";

export type TimeEntryDefaults = {
  date?: string;
  activityType?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  description?: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Campos compartilhados entre o formulário de criação e o de edição de
 * apontamento. Alterna entre "hora inicial/final" e "duração direta"; quando
 * há defaults com duração (e sem horários), começa já no modo direto.
 */
export function TimeEntryFields({ defaults }: { defaults?: TimeEntryDefaults }) {
  const startsDirect = !!defaults?.durationMinutes && !defaults?.startTime && !defaults?.endTime;
  const [mode, setMode] = useState<"range" | "direct">(startsDirect ? "direct" : "range");

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={entryLabelCls}>Data *</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={defaults?.date ?? todayISO()}
            className={entryInputCls}
          />
        </div>
        <div>
          <label className={entryLabelCls}>Tipo *</label>
          <select
            name="activityType"
            defaultValue={defaults?.activityType ?? "Desenvolvimento"}
            className={entryInputCls}
          >
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
              <label className={entryLabelCls}>Hora inicial</label>
              <input
                type="time"
                name="startTime"
                defaultValue={defaults?.startTime ?? ""}
                className={entryInputCls}
              />
            </div>
            <div>
              <label className={entryLabelCls}>Hora final</label>
              <input
                type="time"
                name="endTime"
                defaultValue={defaults?.endTime ?? ""}
                className={entryInputCls}
              />
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label className={entryLabelCls}>Duração (minutos) *</label>
            <input
              type="number"
              min={1}
              name="durationMinutes"
              defaultValue={defaults?.durationMinutes ?? undefined}
              placeholder="ex.: 90"
              className={entryInputCls}
            />
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
        <label className={entryLabelCls}>Descrição do que foi realizado</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults?.description ?? ""}
          className={entryInputCls}
        />
      </div>
    </>
  );
}

export function EntryErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13px] px-3 py-2">
      {message}
    </div>
  );
}
