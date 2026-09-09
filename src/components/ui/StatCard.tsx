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
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] px-4 py-4 sm:px-5 sm:py-5">
      <div className="text-[12.5px] text-[var(--text-muted)] mb-1.5">{label}</div>
      <div className="text-[26px] font-semibold leading-none" style={{ color: toneColor }}>
        {value}
      </div>
      {sub && <div className="text-[12.5px] text-[var(--text-secondary)] mt-2">{sub}</div>}
    </div>
  );
}

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-4 sm:p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
