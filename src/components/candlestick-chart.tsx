import { CheckCircle2, Zap } from "lucide-react";
import type { Candle, Checkpoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Props = { candles: Candle[]; checkpoints: Checkpoint[]; visibleCount?: number; shockIndex?: number; shockHidden?: boolean; currentIndex?: number };
const H = 280, W = 900, PX = 20, PY = 16;

export function CandlestickChart({ candles, checkpoints, visibleCount = candles.length, shockIndex, shockHidden, currentIndex }: Props) {
  const vis = candles.slice(0, Math.max(1, visibleCount));
  if (vis.length === 0) return (
    <div className="chart-svg-wrap" style={{ minHeight: "16rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "0.875rem", color: "var(--t3)" }}>⏳ Waiting for replay data…</p>
    </div>
  );

  const hi = Math.max(...vis.map((c) => c.high));
  const lo = Math.min(...vis.map((c) => c.low));
  const rng = Math.max(hi - lo, 1);
  const step = (W - PX * 2) / Math.max(vis.length - 1, 1);
  const toY = (v: number) => PY + ((hi - v) / rng) * (H - PY * 2);

  return (
    <div className="game-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.25rem", color: "var(--pyth-bright)" }}>Battle Map</p>
          <p className="metric" style={{ fontSize: "0.75rem", color: "var(--t3)" }}>{vis.length} / {candles.length} candles</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[{ c: "var(--lime)", l: "Bull" }, { c: "var(--coral)", l: "Bear" }].map((x) => (
            <span key={x.l} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--t3)", padding: "0.25rem 0.625rem", borderRadius: "var(--r-full)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.c }} />{x.l}
            </span>
          ))}
        </div>
      </div>

      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "16rem", display: "block" }}>
          <defs>
            <linearGradient id="confBand" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(109, 40, 217, 0.1)" />
              <stop offset="100%" stopColor="rgba(109, 40, 217, 0.02)" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((r) => {
            const y = PY + r * (H - PY * 2);
            return (
              <g key={r}>
                <line x1={PX} x2={W - PX} y1={y} y2={y} stroke="rgba(109, 40, 217, 0.06)" strokeDasharray="4 8" />
                <text x={W - 4} y={y - 3} textAnchor="end" fill="var(--t4)" fontSize="9" fontFamily="monospace">{formatCurrency(hi - r * rng)}</text>
              </g>
            );
          })}

          {vis.length > 1 && (
            <path
              d={vis.map((c, i) => { const x = PX + i * step; const cf = c.confidence ?? c.close * 0.0008; return `${i === 0 ? "M" : "L"} ${x} ${toY(c.close + cf)}`; }).join(" ") + " " +
                vis.slice().reverse().map((c, i) => { const ri = vis.length - 1 - i; const x = PX + ri * step; const cf = c.confidence ?? c.close * 0.0008; return `L ${x} ${toY(c.close - cf)}`; }).join(" ") + " Z"}
              fill="url(#confBand)" stroke="rgba(109, 40, 217, 0.2)" strokeWidth="0.5"
            />
          )}

          {checkpoints.filter((cp) => cp.candleIndex < vis.length).map((cp) => (
            <line key={cp.id} x1={PX + cp.candleIndex * step} x2={PX + cp.candleIndex * step} y1={PY} y2={H - PY} stroke="rgba(56, 189, 248, 0.35)" strokeDasharray="4 5" strokeWidth="1" />
          ))}

          {typeof shockIndex === "number" && shockIndex < vis.length && !shockHidden && (
            <line x1={PX + shockIndex * step} x2={PX + shockIndex * step} y1={PY} y2={H - PY} stroke="rgba(255, 77, 106, 0.5)" strokeDasharray="4 5" strokeWidth="1.5" />
          )}

          {vis.map((c, i) => {
            const x = PX + i * step;
            const oY = toY(c.open), cY = toY(c.close), hY = toY(c.high), lY = toY(c.low);
            const up = c.close >= c.open;
            const bY = Math.min(oY, cY), bH = Math.max(Math.abs(cY - oY), 2);
            const col = up ? "rgba(170, 255, 0, 0.9)" : "rgba(255, 77, 106, 0.9)";
            const fill = up ? "rgba(170, 255, 0, 0.15)" : "rgba(255, 77, 106, 0.15)";
            const cw = Math.max(step * 0.4, 3);
            return (
              <g key={`${c.time}-${i}`}>
                <line x1={x} x2={x} y1={hY} y2={lY} stroke={col} strokeWidth="1" />
                <rect x={x - cw / 2} y={bY} width={cw} height={bH} rx="1" fill={fill} stroke={col} strokeWidth="0.7" />
                {currentIndex === i && (
                  <>
                    <circle cx={x} cy={cY} r="4" fill="var(--gold)" opacity="0.9" />
                    <circle cx={x} cy={cY} r="8" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.3">
                      <animate attributeName="r" from="4" to="14" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
        {[{ icon: CheckCircle2, color: "var(--ice)", label: "Checkpoints" }, { icon: Zap, color: "var(--coral)", label: "Boss shock" }].map(({ icon: Icon, color, label }) => (
          <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "var(--t3)", padding: "0.25rem 0.625rem", borderRadius: "var(--r-sm)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
            <Icon size={12} color={color} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}
