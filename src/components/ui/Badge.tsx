const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  "Aberta": { bg: "#e7edf5", fg: "#3a5a80" },
  "Em análise": { bg: "#fdf1d8", fg: "#8a5c00" },
  "Em andamento": { bg: "#cde2fb", fg: "#184f95" },
  "Aguardando retorno": { bg: "#fdf1d8", fg: "#8a5c00" },
  "Concluída": { bg: "#dcf3dc", fg: "#0a6b0a" },
  "Cancelada": { bg: "#f3e6e6", fg: "#8a3a3a" },
};

const PRIORITY_STYLES: Record<string, { bg: string; fg: string }> = {
  "Baixa": { bg: "#eceae6", fg: "#6b6a65" },
  "Média": { bg: "#e7edf5", fg: "#3a5a80" },
  "Alta": { bg: "#fde3d3", fg: "#a1490f" },
  "Urgente": { bg: "#f7d9d9", fg: "#a02020" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "#eee", fg: "#555" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap print:rounded print:px-1.5 print:py-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY_STYLES[priority] ?? { bg: "#eee", fg: "#555" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap print:rounded print:px-1.5 print:py-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {priority}
    </span>
  );
}
