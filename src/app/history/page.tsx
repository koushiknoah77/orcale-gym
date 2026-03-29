"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart2, Crown, Play, Swords, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useWalletSession } from "@/components/wallet-connect-provider";
import { WalletGate } from "@/components/wallet-gate";
import type { HistoryEntry } from "@/lib/types";

type HistoryResponse = {
  history: HistoryEntry[];
  leaderboard: HistoryEntry[];
};

export default function HistoryPage() {
  const { isConnected, status } = useWalletSession();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    let ignore = false;
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) {
          console.error('History API error:', res.status, res.statusText);
          throw new Error(`Failed to fetch history: ${res.status}`);
        }
        const json = (await res.json()) as HistoryResponse;
        if (!ignore) setData(json);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        // Set empty data on error
        if (!ignore) setData({ history: [], leaderboard: [] });
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchHistory();
    return () => { ignore = true; };
  }, [isConnected]);

  // Show loading while checking wallet status
  if (status === "connecting" || loading) {
    return (
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "var(--t3)", fontSize: "0.875rem" }}>Loading...</p>
      </div>
    );
  }

  // Require wallet connection
  if (!isConnected) {
    return (
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Battle History</h1>
          <p style={{ color: "var(--t3)", fontSize: "0.9375rem" }}>Connect your wallet to view your battle history and rankings</p>
        </div>
        <WalletGate />
      </div>
    );
  }

  const allHistory = data?.history ?? [];
  const leaderboard = data?.leaderboard ?? [];

  return (
    <div className="grid-sidebar" style={{ gap: "2rem", maxWidth: "1300px", margin: "0 auto" }}>
      {/* ── LEFT: HISTORY ──────────────────────────── */}
      <section className="game-panel" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--pyth-bright)", marginBottom: "0.375rem" }}>📋 Battle History</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Swords size={20} color="var(--pyth-bright)" /> Arena Log
            </h1>
          </div>
          <Link href="/gym" className="btn btn-lime btn-sm" style={{ padding: "0.5rem 1.25rem" }}>
            <Play size={14} /> New Drill
          </Link>
        </div>

        {allHistory.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", border: "1px dashed var(--border-default)", borderRadius: "var(--r-xl)", background: "rgba(109, 40, 217, 0.02)" }}>
            <Swords size={32} color="var(--t4)" style={{ margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--t2)", marginBottom: "1rem" }}>No battles fought yet.</p>
            <Link href="/gym" style={{ color: "var(--pyth-bright)", fontWeight: 800 }}>Enter the arena →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.5fr", gap: "1rem", padding: "0 1rem 0.75rem", borderBottom: "1px solid var(--border-default)" }}>
              {["Battle", "Mode", "Date", "Score", "Change", ""].map((h) => (
                <span key={h} className="metric-label" style={{ textAlign: h === "Score" || h === "Change" ? "right" : "left" }}>{h}</span>
              ))}
            </div>

            {allHistory.map((e) => (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.5fr", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "var(--r-lg)", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", transition: "all 200ms ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--pyth-dim)", border: "1px solid rgba(109, 40, 217, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, color: "var(--pyth-bright)", flexShrink: 0 }}>{e.assetLabel.slice(0, 2)}</div>
                  <div>
                    <span style={{ fontWeight: 800, display: "block" }}>{e.assetLabel}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--t3)" }}>{e.scenarioLabel}</span>
                  </div>
                </div>
                <div><span className="badge badge-n" style={{ fontSize: "0.625rem" }}>{e.modeLabel}</span></div>
                <div style={{ fontSize: "0.8125rem", color: "var(--t2)" }}>{e.completedAtLabel}</div>
                <div style={{ textAlign: "right" }}>
                  <span className="metric" style={{ fontSize: "1.125rem", fontWeight: 800 }}>{e.total}</span>
                  <span style={{ display: "block", fontSize: "0.625rem", color: "var(--t3)", marginTop: "0.125rem" }}>{e.grade}</span>
                </div>
                <div className="metric" style={{ textAlign: "right", fontWeight: 800, fontSize: "0.875rem", color: e.changePct >= 0 ? "var(--lime)" : "var(--coral)" }}>{e.changePct >= 0 ? "+" : ""}{e.changePct.toFixed(2)}%</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {e.href && <Link href={e.href} style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--pyth-dim)", border: "1px solid rgba(109, 40, 217, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pyth-bright)" }}><ArrowUpRight size={16} /></Link>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── RIGHT: LEADERBOARD ──────────────────────── */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <section className="game-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Trophy size={18} color="var(--gold)" />
            <span style={{ fontSize: "1.125rem", fontWeight: 800 }}>🏆 Leaderboard</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(leaderboard.length > 0 ? leaderboard : allHistory.slice(0, 6)).map((e, i) => {
              const medalColors = [
                { bg: "linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 215, 0, 0.04))", border: "rgba(255, 215, 0, 0.3)", numBg: "var(--gold)", numColor: "#0A0A1B", glow: "0 0 12px rgba(255, 215, 0, 0.3)" },
                { bg: "linear-gradient(135deg, rgba(192, 192, 192, 0.08), transparent)", border: "var(--border-default)", numBg: "var(--elevated)", numColor: "var(--t2)", glow: "none" },
                { bg: "linear-gradient(135deg, rgba(205, 127, 50, 0.08), transparent)", border: "var(--border-default)", numBg: "var(--elevated)", numColor: "var(--t2)", glow: "none" },
              ];
              const mc = medalColors[i] ?? medalColors[2];
              return (
                <div key={`${e.id}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderRadius: "var(--r-lg)", background: mc.bg, border: `1px solid ${mc.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ width: 32, height: 32, borderRadius: "50%", background: mc.numBg, color: mc.numColor, fontSize: "0.875rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: mc.glow }}>
                      {i === 0 ? "👑" : i + 1}
                    </span>
                    <div>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{e.assetLabel}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--t3)", marginTop: "0.125rem" }}>{e.scenarioLabel} · {e.modeLabel}</p>
                    </div>
                  </div>
                  <p className="metric" style={{ fontSize: "1.5rem", fontWeight: 800, color: i === 0 ? "var(--gold)" : "var(--t1)" }}>{e.total}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="game-panel" style={{ padding: "2rem" }}>
          <p className="eyebrow" style={{ color: "var(--pyth-bright)", marginBottom: "1.25rem" }}>💡 Pro Tips</p>
          {["Compare how different scenarios punish the same instinct.", "The leaderboard mixes seeded examples with live sessions.", "Owner-scoped battles keep your metrics perfectly isolated."].map((item) => (
            <p key={item} style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--t2)", display: "flex", gap: "0.75rem", marginBottom: "0.875rem" }}>
              <span style={{ color: "var(--lime)", fontWeight: 800, flexShrink: 0 }}>▸</span>{item}
            </p>
          ))}
        </section>
      </aside>
    </div>
  );
}
