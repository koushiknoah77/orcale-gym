"use client";

import { useEffect, useState } from "react";
import { Activity, WifiOff } from "lucide-react";
import type { LivePriceSnapshot } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

type LiveResponse = { prices: LivePriceSnapshot[] };

// Crypto icon mapping - using CoinGecko API for official icons
const CRYPTO_ICONS: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  ATOM: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  PYTH: "https://assets.coingecko.com/coins/images/31924/small/pyth.png",
};

export function LiveMarketStrip({ assetKeys = ["BTC", "ETH", "SOL", "PYTH"] }: { assetKeys?: string[] }) {
  const [prices, setPrices] = useState<LivePriceSnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const query = assetKeys.join(",");

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const r = await fetch(`/api/live?assetKeys=${encodeURIComponent(query)}`);
        if (!r.ok) throw new Error();
        const j = (await r.json()) as LiveResponse;
        if (!dead) { setPrices(j.prices); setError(null); }
      } catch { if (!dead) setError("Live prices unavailable."); }
    }
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => { dead = true; window.clearInterval(id); };
  }, [query]);

  return (
    <div className="game-panel" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Activity size={18} color="var(--pyth-bright)" />
          <span style={{ fontSize: "1rem", fontWeight: 700 }}>Live Arena Prices</span>
          <span className="badge badge-g"><div className="dot-live" style={{ width: 5, height: 5 }} /> Pyth Hermes</span>
        </div>
        <span className="metric" style={{ fontSize: "0.6875rem", color: "var(--t4)" }}>Auto-refresh 30s</span>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", borderRadius: "var(--r-md)", background: "var(--coral-dim)", border: "1px solid rgba(255, 77, 106, 0.2)", fontSize: "0.8125rem", color: "var(--coral)", marginBottom: "1rem" }}>
          <WifiOff size={14} />{error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {(prices.length > 0 ? prices : assetKeys.map((k) => ({ assetKey: k, price: 0, relativeConfidencePct: 0, publishTime: 0 } as LivePriceSnapshot))).map((p) => (
          <div key={p.assetKey} className="game-card game-card-hover" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                {CRYPTO_ICONS[p.assetKey] && (
                  <Image 
                    src={CRYPTO_ICONS[p.assetKey]} 
                    alt={p.assetKey}
                    width={28}
                    height={28}
                    style={{ borderRadius: "50%" }}
                    unoptimized
                  />
                )}
                <span style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{p.assetKey}<span style={{ color: "var(--t4)", fontWeight: 400 }}>/USD</span></span>
              </div>
            </div>
            {p.price > 0 ? (
              <>
                <p className="metric" style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>{formatCurrency(p.price)}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--t3)" }}>Confidence</span>
                  <span className="metric" style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--pyth-bright)" }}>±{p.relativeConfidencePct.toFixed(3)}%</span>
                </div>
                <div style={{ marginTop: "0.5rem", height: 4, borderRadius: 2, background: "var(--elevated)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.max(5, 100 - p.relativeConfidencePct * 100))}%`, background: "linear-gradient(90deg, var(--pyth), var(--pyth-light))", borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ height: "1.75rem", width: "60%", borderRadius: "var(--r-sm)", background: "var(--elevated)", marginBottom: "0.75rem" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}><div className="dot-live" style={{ width: 4, height: 4 }} /><span style={{ fontSize: "0.75rem", color: "var(--t4)" }}>Loading…</span></div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
