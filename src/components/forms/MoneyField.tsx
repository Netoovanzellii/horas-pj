"use client";

import { centsToInput } from "@/lib/money";

const labelCls = "block text-[12.5px] font-medium text-[var(--text-secondary)] mb-1";

/**
 * Campo de valor em reais (pt-BR) com prefixo "R$". O valor é enviado no
 * formulário como texto ("18,00"); a action converte para centavos.
 */
export function MoneyField({
  name,
  label,
  defaultCents,
}: {
  name: string;
  label: string;
  defaultCents?: number | null;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          name={name}
          defaultValue={centsToInput(defaultCents)}
          placeholder="0,00"
          className="w-full rounded-md border border-[var(--border-hairline)] bg-white pl-9 pr-3 py-2 text-[14px] outline-none focus:border-[var(--series-1)] focus:ring-2 focus:ring-[var(--series-1-wash)]"
        />
      </div>
    </div>
  );
}
