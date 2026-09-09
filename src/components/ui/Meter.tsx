export function Meter({ percent, overage }: { percent: number; overage: boolean }) {
  const clamped = Math.min(percent, 100);
  const fillColor = overage
    ? "var(--status-critical)"
    : percent >= 85
    ? "var(--status-warning)"
    : "var(--series-1)";
  const trackColor = overage ? "#f7d9d9" : "var(--series-1-wash)";

  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: trackColor }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}
