"use client";

import { useActionState } from "react";
import { createClientAction } from "@/app/actions/contract";
import type { ActionResult } from "@/app/actions/requests";

const inputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
const labelCls = "block text-[12.5px] font-medium text-[var(--text-secondary)] mb-1";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewClientForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createClientAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {state && !state.ok && (
        <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13.5px] px-3 py-2">{state.error}</div>
      )}

      <div>
        <label className={labelCls}>Nome / Razão Social *</label>
        <input name="name" required className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>CNPJ</label>
          <input name="cnpj" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" name="email" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Telefone</label>
        <input name="phone" className={inputCls} />
      </div>

      <div className="border-t border-[var(--border-hairline)] pt-4">
        <div className="text-[13px] font-medium mb-3">Contrato</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Franquia mensal de horas</label>
            <div className="flex items-center gap-2">
              <input type="number" name="hoursPart" min={0} defaultValue={15} className={inputCls} />
              <span className="text-[13px] text-[var(--text-muted)]">h</span>
              <input type="number" name="minutesPart" min={0} max={59} defaultValue={0} className={inputCls} />
              <span className="text-[13px] text-[var(--text-muted)]">min</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Dia de fechamento (1–31)</label>
            <input type="number" name="closingDay" min={1} max={31} defaultValue={10} required className={inputCls} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls}>Início do contrato</label>
          <input type="date" name="startDate" defaultValue={todayISO()} required className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelCls}>Valor mensal (R$, opcional)</label>
            <input type="number" name="monthlyValueCents" min={0} step={1} placeholder="em centavos" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Valor da hora excedente (R$, opcional)</label>
            <input type="number" name="overtimeHourValueCents" min={0} step={1} placeholder="em centavos" className={inputCls} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Observações</label>
        <textarea name="notes" rows={2} className={inputCls} />
      </div>

      <div>
        <button type="submit" disabled={pending} className="rounded-md bg-[var(--series-1)] text-white text-[14px] font-medium px-4 py-2 disabled:opacity-60">
          {pending ? "Cadastrando..." : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}
