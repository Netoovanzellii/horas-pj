"use client";

import { useActionState } from "react";
import { updateClientInfo } from "@/app/actions/contract";
import type { ActionResult } from "@/app/actions/requests";

const inputCls =
  "w-full rounded-md border border-[var(--border-hairline)] bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]";
const labelCls = "block text-[12.5px] font-medium text-[var(--text-secondary)] mb-1";

export function ClientForm({
  clientId,
  name,
  cnpj,
  email,
  phone,
  notes,
}: {
  clientId: number;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}) {
  const action = updateClientInfo.bind(null, clientId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-xl">
      {state && !state.ok && (
        <div className="rounded-md bg-[#fdf1f1] border border-[#f0c9c9] text-[#8a2c2c] text-[13.5px] px-3 py-2">{state.error}</div>
      )}
      {state && state.ok && (
        <div className="rounded-md bg-[#dcf3dc] border border-[#b9e0b9] text-[#0a6b0a] text-[13.5px] px-3 py-2">Dados salvos.</div>
      )}

      <div>
        <label className={labelCls}>Nome / Razão Social *</label>
        <input name="name" defaultValue={name} required className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>CNPJ</label>
          <input name="cnpj" defaultValue={cnpj ?? undefined} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" name="email" defaultValue={email ?? undefined} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Telefone</label>
        <input name="phone" defaultValue={phone ?? undefined} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Observações</label>
        <textarea name="notes" defaultValue={notes ?? undefined} rows={2} className={inputCls} />
      </div>

      <div>
        <button type="submit" disabled={pending} className="rounded-md bg-[var(--series-1)] text-white text-[14px] font-medium px-4 py-2 disabled:opacity-60">
          {pending ? "Salvando..." : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
