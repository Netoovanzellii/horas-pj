"use client";

import { useActionState } from "react";
import { updateContractConfig } from "@/app/actions/contract";
import type { ActionResult } from "@/app/actions/requests";

const inputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
const labelCls = "block text-[12.5px] font-medium text-[var(--text-secondary)] mb-1";

const PRESETS_HOURS = [5, 10, 15, 20, 25, 30];

export function ContractForm({
  contractId,
  hoursPerPeriodMinutes,
  closingDay,
  monthlyValueCents,
  overtimeHourValueCents,
}: {
  contractId: number;
  hoursPerPeriodMinutes: number;
  closingDay: number;
  monthlyValueCents: number | null;
  overtimeHourValueCents: number | null;
}) {
  const action = updateContractConfig.bind(null, contractId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  const hoursPart = Math.floor(hoursPerPeriodMinutes / 60);
  const minutesPart = hoursPerPeriodMinutes % 60;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {state && !state.ok && (
        <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13.5px] px-3 py-2">{state.error}</div>
      )}
      {state && state.ok && (
        <div className="rounded-md bg-[#dcf3dc] border border-[#b9e0b9] text-[#0a6b0a] text-[13.5px] px-3 py-2">
          Configuração salva.
        </div>
      )}

      <div>
        <label className={labelCls}>Franquia mensal de horas</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {PRESETS_HOURS.map((h) => (
            <label key={h} className="text-[12.5px] border border-[var(--border-hairline)] rounded-md px-2.5 py-1 cursor-pointer has-checked:bg-[var(--series-1-wash)] has-checked:border-[var(--series-1)] has-checked:text-[var(--series-1-strong)]">
              <input
                type="radio"
                name="hoursPreset"
                className="sr-only"
                defaultChecked={hoursPart === h && minutesPart === 0}
                onChange={(e) => {
                  const form = e.currentTarget.closest("form");
                  if (!form) return;
                  (form.elements.namedItem("hoursPart") as HTMLInputElement).value = String(h);
                  (form.elements.namedItem("minutesPart") as HTMLInputElement).value = "0";
                }}
              />
              {h}h
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="number" name="hoursPart" min={0} defaultValue={hoursPart} className={inputCls} />
          <span className="text-[13px] text-[var(--text-muted)]">h</span>
          <input type="number" name="minutesPart" min={0} max={59} defaultValue={minutesPart} className={inputCls} />
          <span className="text-[13px] text-[var(--text-muted)]">min</span>
        </div>
      </div>

      <div>
        <label className={labelCls}>Dia de fechamento (1–31)</label>
        <input type="number" name="closingDay" min={1} max={31} defaultValue={closingDay} required className={inputCls} />
        <p className="text-[12px] text-[var(--text-muted)] mt-1">
          O período de apuração vai do dia de fechamento de um mês até o mesmo dia do mês seguinte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Valor mensal (R$, opcional)</label>
          <input
            type="number"
            name="monthlyValueCents"
            min={0}
            step={1}
            defaultValue={monthlyValueCents ?? undefined}
            placeholder="em centavos"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Valor da hora excedente (R$, opcional)</label>
          <input
            type="number"
            name="overtimeHourValueCents"
            min={0}
            step={1}
            defaultValue={overtimeHourValueCents ?? undefined}
            placeholder="em centavos"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <button type="submit" disabled={pending} className="rounded-md bg-[var(--series-1)] text-white text-[14px] font-medium px-4 py-2 disabled:opacity-60">
          {pending ? "Salvando..." : "Salvar contrato"}
        </button>
      </div>
    </form>
  );
}
