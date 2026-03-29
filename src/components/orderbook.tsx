"use client";

import { formatCurrency, makeSeededRandom } from "@/lib/utils";
import type { Candle } from "@/lib/types";

type Props = { currentCandle: Candle; visibleCount: number; difficulty: "easy" | "medium" | "chaos" };
type E = { price: number; size: number; total: number };

export function Orderbook({ currentCandle, visibleCount, difficulty }: Props) {
  const price = currentCandle.close;
  const conf  = currentCandle.confidence ?? price * 0.0008;
  const rng   = makeSeededRandom(`ob-${visibleCount}`);
  const tick  = Math.max(price * 0.0001, 1e-8);
  const sp    = Math.max(Math.ceil(conf / tick), 1);
  const depth = difficulty === "chaos" ? 12 : 8;

  const asks: E[] = [], bids: E[] = [];
  let ta = 0, tb = 0;
  for (let i = 0; i < depth; i++) {
    const ap = price + (sp + i) * tick; const as_ = 0.5 + rng() * 4; ta += as_;
    asks.unshift({ price: ap, size: as_, total: ta });
    const bp = price - (sp + i) * tick; const bs = 0.5 + rng() * 4; tb += bs;
    bids.push({ price: bp, size: bs, total: tb });
  }
  const maxT = Math.max(1, ...asks.map((e) => e.total), ...bids.map((e) => e.total));
  const spreadPct = price === 0 ? 0 : (((asks[asks.length - 1]?.price ?? price) - (bids[0]?.price ?? price)) / price) * 100;

  return (
    <div className="game-panel" style={{ padding: "1.5rem", fontFamily: "var(--font-mono), monospace", fontSize: "0.8125rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span className="eyebrow" style={{ color: "var(--pyth-bright)", letterSpacing: "0.12em" }}>📊 Orderbook</span>
        <span className="metric" style={{ fontSize: "0.6875rem", color: "var(--t4)" }}>Conf: ±{formatCurrency(currentCandle.confidence ?? 0)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "0.5rem" }}>
          {asks.map((a, i) => (
            <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0.625rem", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, background: "linear-gradient(90deg, transparent, var(--coral-dim))", width: `${(a.total / maxT) * 100}%`, transition: "width 400ms ease", zIndex: 0 }} />
              <span style={{ position: "relative", fontWeight: 700, color: "var(--coral)", fontVariantNumeric: "tabular-nums", zIndex: 1 }}>{formatCurrency(a.price)}</span>
              <span style={{ position: "relative", color: "var(--t2)", fontVariantNumeric: "tabular-nums", zIndex: 1 }}>{a.size.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.625rem", margin: "0.5rem 0", borderRadius: "var(--r-sm)", background: "var(--pyth-dim)", border: "1px solid var(--border-default)", fontSize: "0.75rem", fontWeight: 800, color: "var(--pyth-bright)", letterSpacing: "0.06em" }}>
          Spread: {spreadPct.toFixed(3)}%
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {bids.map((b, i) => (
            <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0.625rem", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, background: "linear-gradient(90deg, transparent, var(--lime-dim))", width: `${(b.total / maxT) * 100}%`, transition: "width 400ms ease", zIndex: 0 }} />
              <span style={{ position: "relative", fontWeight: 700, color: "var(--lime)", fontVariantNumeric: "tabular-nums", zIndex: 1 }}>{formatCurrency(b.price)}</span>
              <span style={{ position: "relative", color: "var(--t2)", fontVariantNumeric: "tabular-nums", zIndex: 1 }}>{b.size.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
