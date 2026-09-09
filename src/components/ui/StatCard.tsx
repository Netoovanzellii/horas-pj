import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warning" | "critical";
}) {
  const toneColor =
    tone === "good"
      ? "var(--status-good)"
      : tone === "warning"
      ? "#b3760a"
      : tone === "critical"
      ? "var(--status-critical)"
      : "var(--text-primary)";

  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] px-4 py-4 sm:px-5 sm:py-5 print:rounded-none print:border print:border-black/15 print:shadow-none print:break-inside-avoid print:px-3 print:py-2.5">
      <div className="text-[12.5px] text-[var(--text-muted)] mb-1.5 print:text-black/60 print:text-[10.5px]">{label}</div>
      <div className="text-[26px] font-semibold leading-none print:text-[18px]" style={{ color: toneColor }}>
        {value}
      </div>
      {sub && <div className="text-[12.5px] text-[var(--text-secondary)] mt-2">{sub}</div>}
    </div>
  );
}

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-4 sm:p-5 print:rounded-none print:border-0 print:border-t print:border-t-black/15 print:bg-transparent print:px-0 print:pt-4 print:pb-0">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)] print:text-[12px] print:uppercase print:tracking-wide">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
