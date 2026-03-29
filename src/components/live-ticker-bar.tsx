"use client";

import { useEffect, useState } from "react";
import type { LivePriceSnapshot } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type LiveResponse = { prices: LivePriceSnapshot[] };
const KEYS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "MATIC", "LINK", "UNI", "ATOM", "PYTH"];

export function LiveTickerBar() {
  const [prices, setPrices] = useState<LivePriceSnapshot[]>([]);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const r = await fetch(`/api/live?assetKeys=${encodeURIComponent(KEYS.join(","))}`);
        if (!r.ok) return;
        const j = (await r.json()) as LiveResponse;
        if (!dead) setPrices(j.prices);
      } catch { /* silent */ }
    }
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => { dead = true; window.clearInterval(id); };
  }, []);

  if (prices.length === 0) {
    return (
      <div className="ticker-bar">
        <div className="ticker-bar-scroll">
          <div className="ticker-bar-track">
            <div className="dot-live" />
            <span className="ticker-symbol" style={{ marginLeft: "0.5rem" }}>Pyth Hermes</span>
            <span className="ticker-sep" />
            {KEYS.map((k) => (
              <div key={k} className="ticker-item">
                <span className="ticker-symbol">{k}</span>
                <span className="ticker-price" style={{ color: "var(--t4)" }}>—</span>
              </div>
            ))}
          </div>
          <div className="ticker-bar-track" aria-hidden="true">
            <div className="dot-live" />
            <span className="ticker-symbol" style={{ marginLeft: "0.5rem" }}>Pyth Hermes</span>
            <span className="ticker-sep" />
            {KEYS.map((k) => (
              <div key={`dup-${k}`} className="ticker-item">
                <span className="ticker-symbol">{k}</span>
                <span className="ticker-price" style={{ color: "var(--t4)" }}>—</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticker-bar">
      <div className="ticker-bar-scroll">
        <div className="ticker-bar-track">
          <div className="dot-live" />
          <span className="ticker-symbol" style={{ marginLeft: "0.5rem", color: "var(--lime)" }}>LIVE</span>
          <span className="ticker-sep" />
          {prices.map((p) => {
            const confHigh = p.relativeConfidencePct > 0.05;
            return (
              <div key={p.assetKey} className="ticker-item">
                <span className="ticker-symbol">{p.assetKey}</span>
                <span className="ticker-price">{formatCurrency(p.price)}</span>
                <span className={`ticker-change ${confHigh ? "down" : "up"}`}>
                  ±{p.relativeConfidencePct.toFixed(3)}%
                </span>
                <span className="ticker-sep" />
              </div>
            );
          })}
        </div>
        <div className="ticker-bar-track" aria-hidden="true">
          <div className="dot-live" />
          <span className="ticker-symbol" style={{ marginLeft: "0.5rem", color: "var(--lime)" }}>LIVE</span>
          <span className="ticker-sep" />
          {prices.map((p) => {
            const confHigh = p.relativeConfidencePct > 0.05;
            return (
              <div key={`dup-${p.assetKey}`} className="ticker-item">
                <span className="ticker-symbol">{p.assetKey}</span>
                <span className="ticker-price">{formatCurrency(p.price)}</span>
                <span className={`ticker-change ${confHigh ? "down" : "up"}`}>
                  ±{p.relativeConfidencePct.toFixed(3)}%
                </span>
                <span className="ticker-sep" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
