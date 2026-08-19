"use client";

import { useState, useMemo } from "react";
import { formatMinutesShort } from "@/lib/time";

export interface UsagePoint {
  dateLabel: string; // dd/mm
  cumulativeMinutes: number;
}

export function UsageChart({
  points,
  contractedMinutes,
}: {
  points: UsagePoint[];
  contractedMinutes: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 600;
  const H = 220;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;

  const maxValue = Math.max(contractedMinutes, ...points.map((p) => p.cumulativeMinutes), 1) * 1.15;

  const xFor = (i: number) => {
    if (points.length <= 1) return padL;
    return padL + (i / (points.length - 1)) * (W - padL - padR);
  };
  const yFor = (v: number) => H - padB - (v / maxValue) * (H - padT - padB);

  const linePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.cumulativeMinutes).toFixed(1)}`).join(" ");
  }, [points, maxValue]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const base = `M ${xFor(0).toFixed(1)} ${yFor(0).toFixed(1)} `;
    const line = points.map((p, i) => `L ${xFor(i).toFixed(1)} ${yFor(p.cumulativeMinutes).toFixed(1)}`).join(" ");
    const close = ` L ${xFor(points.length - 1).toFixed(1)} ${yFor(0).toFixed(1)} Z`;
    return base + line + close;
  }, [points, maxValue]);

  const refY = yFor(contractedMinutes);
  const last = points[points.length - 1];
  const overage = last && last.cumulativeMinutes > contractedMinutes;

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[220px] overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * W;
          if (points.length <= 1) return;
          const idx = Math.round(((relX - padL) / (W - padL - padR)) * (points.length - 1));
          setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
        }}
      >
        {/* gridlines (hairline, horizontal, recessive) */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + t * (H - padT - padB);
          return <line key={t} x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />;
        })}

        {/* reference line: franquia contratada */}
        <line
          x1={padL}
          x2={W - padR}
          y1={refY}
          y2={refY}
          stroke="var(--text-muted)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <text x={W - padR} y={refY - 6} textAnchor="end" fontSize="11" fill="var(--text-secondary)">
          Franquia {formatMinutesShort(contractedMinutes)}
        </text>

        {/* area fill */}
        {points.length > 0 && <path d={areaPath} fill="var(--series-1)" opacity={0.1} />}

        {/* line */}
        {points.length > 0 && (
          <path d={linePath} fill="none" stroke={overage ? "var(--status-critical)" : "var(--series-1)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* end marker */}
        {last && (
          <circle
            cx={xFor(points.length - 1)}
            cy={yFor(last.cumulativeMinutes)}
            r={4}
            fill={overage ? "var(--status-critical)" : "var(--series-1)"}
            stroke="var(--surface-1)"
            strokeWidth={2}
          />
        )}

        {/* hover crosshair */}
        {hovered && (
          <>
            <line
              x1={xFor(hoverIdx!)}
              x2={xFor(hoverIdx!)}
              y1={padT}
              y2={H - padB}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
            <circle
              cx={xFor(hoverIdx!)}
              cy={yFor(hovered.cumulativeMinutes)}
              r={4}
              fill="var(--series-1)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          </>
        )}

        {/* x-axis labels: first, mid, last */}
        {points.length > 0 && (
          <>
            <text x={xFor(0)} y={H - 8} fontSize="11" fill="var(--text-muted)" textAnchor="start">
              {points[0].dateLabel}
            </text>
            <text x={xFor(points.length - 1)} y={H - 8} fontSize="11" fill="var(--text-muted)" textAnchor="end">
              {points[points.length - 1].dateLabel}
            </text>
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute top-0 pointer-events-none rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12px] shadow-sm"
          style={{
            left: `${(xFor(hoverIdx!) / W) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="text-[var(--text-muted)]">{hovered.dateLabel}</div>
          <div className="font-medium text-[var(--text-primary)]">{formatMinutesShort(hovered.cumulativeMinutes)}</div>
        </div>
      )}
    </div>
  );
}
