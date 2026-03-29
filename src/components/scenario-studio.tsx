"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, Coins, Crown, RefreshCw, Shield, Skull, Sparkles, Star, Swords, Zap } from "lucide-react";
import { ACTION_LABELS, DEFAULT_RISK_RULES, DIFFICULTY_OPTIONS, SCENARIO_OPTIONS, WINDOW_OPTIONS } from "@/lib/constants";
import type { AssetOption, Difficulty, LivePriceSnapshot, ReplayMode, Scenario, ScenarioType, UserStats } from "@/lib/types";
import { formatCurrency, formatPercent, formatTimestampLabel } from "@/lib/utils";

type SymbolsResponse = { symbols: AssetOption[] };
type ScenarioPreviewResponse = { scenario: Scenario };
type SessionCreateResponse = { sessionId: string };
type LiveResponse = { prices: LivePriceSnapshot[] };

function Label({ children }: { children: React.ReactNode }) {
  return <span className="metric-label" style={{ display: "block", marginBottom: "0.375rem" }}>{children}</span>;
}

const DIFF_ICONS = { easy: Star, medium: Zap, chaos: Skull };
const DIFF_LABELS = { easy: "Rookie", medium: "Warrior", chaos: "Legendary" };

export function ScenarioStudio() {
  const router = useRouter();
  const [symbols, setSymbols] = useState<AssetOption[]>([]);
  const [search, setSearch] = useState("BTC");
  const deferredSearch = useDeferredValue(search);
  const [assetKey, setAssetKey] = useState("BTC");
  const [scenarioType, setScenarioType] = useState<ScenarioType>("breakout");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<ReplayMode>("human");
  const [windowHours, setWindowHours] = useState(12);
  const [riskRules, setRiskRules] = useState(DEFAULT_RISK_RULES);
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [starting, setStarting] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<LivePriceSnapshot | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // ── Data fetching (all logic preserved) ────────────────────
  useEffect(() => {
    let ignore = false;
    async function loadSymbols() {
      try {
        const res = await fetch(`/api/symbols?query=${encodeURIComponent(deferredSearch)}`);
        const json = (await res.json()) as SymbolsResponse;
        if (!ignore) {
          setSymbols(json.symbols);
          if (!json.symbols.some((s) => s.key === assetKey) && json.symbols[0]) setAssetKey(json.symbols[0].key);
        }
      } catch { if (!ignore) setError("Could not load symbols."); }
    }
    void loadSymbols();
    return () => { ignore = true; };
  }, [assetKey, deferredSearch]);

  useEffect(() => {
    let ignore = false;
    async function loadLive() {
      try {
        const res = await fetch(`/api/live?assetKeys=${encodeURIComponent(assetKey)}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as LiveResponse;
        if (!ignore) setLivePrice(json.prices[0] ?? null);
      } catch { if (!ignore) setLivePrice(null); }
    }
    void loadLive();
    return () => { ignore = true; };
  }, [assetKey]);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/user-stats");
        const json = (await res.json()) as UserStats;
        setBalance(json.balance);
        setUserStats(json);
      } catch { /* silent */ }
    }
    void fetchBalance();
    const id = setInterval(fetchBalance, 10000);
    return () => clearInterval(id);
  }, [starting, previewNonce]);

  useEffect(() => {
    let ignore = false;
    async function loadPreview() {
      setLoadingPreview(true); setError(null);
      try {
        const res = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetKey, scenarioType, difficulty, windowHours, mode, riskRules }) });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as ScenarioPreviewResponse;
        if (!ignore) setPreview(json.scenario);
      } catch { if (!ignore) setError("Preview failed. Try another asset."); }
      finally { if (!ignore) setLoadingPreview(false); }
    }
    void loadPreview();
    return () => { ignore = true; };
  }, [assetKey, difficulty, mode, previewNonce, riskRules, scenarioType, windowHours]);

  async function handleStart() {
    // Check if user has enough balance
    if (balance !== null && balance < 100) {
      setError("Insufficient coins. You need 100 coins to start a game.");
      return;
    }
    
    setStarting(true); setError(null);
    try {
      const res = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetKey, scenarioType, difficulty, windowHours, mode, riskRules }) });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Could not start session.");
      }
      
      const json = (await res.json()) as SessionCreateResponse;
      startTransition(() => router.push(`/replay/${json.sessionId}`));
    } catch (err) { 
      setError(err instanceof Error ? err.message : "Could not start session."); 
    }
    finally { setStarting(false); }
  }

  const selectedScenario = SCENARIO_OPTIONS.find((s) => s.type === scenarioType);

  return (
    <div className="grid-sidebar">
      {/* ── LEFT: CONFIG ─────────────────────────────── */}
      <section className="game-panel" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Swords size={18} color="var(--pyth-bright)" />
              <p className="eyebrow" style={{ color: "var(--pyth-bright)" }}>Battle Config</p>
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Choose Your Arena</h1>
          </div>
          {balance !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <div className="badge badge-pyth" style={{ padding: "0.35rem 0.875rem" }}>
                <Coins size={11} /> <span className="metric" style={{ fontSize: "0.75rem" }}>{balance.toLocaleString()} coins</span>
              </div>
              {userStats?.dailyBonusAvailable && (
                <div className="badge badge-g" style={{ padding: "0.35rem 0.875rem" }}>
                  <Sparkles size={11} /> <span style={{ fontSize: "0.75rem" }}>Daily +100 ready</span>
                </div>
              )}
              {userStats && userStats.streak > 0 && (
                <div className="badge badge-amber" style={{ padding: "0.35rem 0.875rem" }} title="Estimated reward for 75 score">
                  <Star size={11} /> <span style={{ fontSize: "0.75rem" }}>Est: ~{Math.round(75 * 2.5 * userStats.streakMultiplier)} coins</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Asset */}
          <div className="grid-2col">
            <div>
              <Label>Search Asset</Label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="BTC, ETH, SOL..." className="field" style={{ width: "100%", padding: "0.6rem 0.875rem", fontSize: "0.875rem" }} />
            </div>
            <div>
              <Label>Price Feed</Label>
              <select value={assetKey} onChange={(e) => setAssetKey(e.target.value)} className="field" style={{ width: "100%", padding: "0.6rem 0.875rem", fontSize: "0.875rem" }}>
                {symbols.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Scenario type */}
          <div>
            <Label>Battle Mode</Label>
            <div className="grid-2col">
              {SCENARIO_OPTIONS.map((opt) => {
                const active = opt.type === scenarioType;
                return (
                  <button key={opt.type} type="button" onClick={() => setScenarioType(opt.type)}
                    style={{
                      padding: "0.875rem", borderRadius: "var(--r-lg)",
                      border: active ? "2px solid var(--pyth)" : "2px solid var(--border-default)",
                      background: active ? "var(--pyth-dim)" : "rgba(18, 18, 43, 0.3)",
                      textAlign: "left", cursor: "pointer", transition: "all 200ms ease",
                      boxShadow: active ? "0 0 20px var(--pyth-dim), inset 0 0 20px rgba(109, 40, 217, 0.05)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 800, color: active ? "var(--pyth-bright)" : "var(--t1)" }}>{opt.label}</span>
                      <span className="metric" style={{ fontSize: "0.5625rem", color: "var(--t4)", padding: "0.125rem 0.5rem", borderRadius: "var(--r-full)", background: "rgba(255,255,255,0.04)" }}>{opt.pacing}</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--t3)", lineHeight: 1.5 }}>{opt.copy}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty — Game Cards */}
          <div>
            <Label>Difficulty Tier</Label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const active = opt.value === difficulty;
                const DIcon = DIFF_ICONS[opt.value];
                return (
                  <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)}
                    className={`diff-card ${opt.value}${active ? " active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    <DIcon size={22} color={active ? "var(--dc)" : "var(--t3)"} style={{ margin: "0 auto 0.5rem" }} />
                    <span style={{ display: "block", fontWeight: 800, fontSize: "0.9375rem", color: active ? "var(--dc)" : "var(--t1)" }}>
                      {DIFF_LABELS[opt.value]}
                    </span>
                    <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--t3)", marginTop: "0.25rem" }}>{opt.copy}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Window / Mode */}
          <div className="grid-2col">
            <div>
              <Label>Window</Label>
              <select value={String(windowHours)} onChange={(e) => setWindowHours(Number(e.target.value))} className="field" style={{ width: "100%", padding: "0.6rem 0.875rem", fontSize: "0.875rem" }}>
                {WINDOW_OPTIONS.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Pilot Mode</Label>
              <select value={mode} onChange={(e) => setMode(e.target.value as ReplayMode)} className="field" style={{ width: "100%", padding: "0.6rem 0.875rem", fontSize: "0.875rem" }}>
                <option value="human">🎮 Human Pilot</option>
                <option value="agent">🤖 Agent Autopilot</option>
              </select>
            </div>
          </div>

          {/* Risk rules */}
          <div style={{ paddingTop: "1.25rem", borderTop: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Shield size={14} color="var(--amber)" />
              <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>Risk Rules</span>
            </div>
            <div className="grid-2col">
              {[
                { key: "maxLossPct", label: "Max loss %", min: 1, max: 10 },
                { key: "leverageCap", label: "Leverage cap", min: 1, max: 5 },
                { key: "cooldownBars", label: "Cooldown bars", min: 1, max: 8 },
                { key: "patienceThreshold", label: "Patience", min: 40, max: 95 },
              ].map((field) => (
                <div key={field.key}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <Label>{field.label}</Label>
                    <span className="metric" style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--pyth-bright)" }}>{riskRules[field.key as keyof typeof riskRules]}</span>
                  </div>
                  <input type="range" min={field.min} max={field.max} value={riskRules[field.key as keyof typeof riskRules]}
                    onChange={(e) => setRiskRules((c) => ({ ...c, [field.key]: Number(e.target.value) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", paddingTop: "0.5rem" }}>
            <button type="button" onClick={() => setRiskRules(DEFAULT_RISK_RULES)} className="btn btn-ghost btn-sm">Reset</button>
            <button type="button" onClick={() => setPreviewNonce((n) => n + 1)} className="btn btn-outline btn-sm">
              <RefreshCw size={13} className={loadingPreview ? "animate-spin" : ""} /> Reroll
            </button>
            <button 
              type="button" 
              disabled={starting || (balance !== null && balance < 100)} 
              onClick={() => void handleStart()} 
              className="btn btn-lime btn-sm"
              style={{ 
                opacity: (starting || (balance !== null && balance < 100)) ? 0.6 : 1, 
                padding: "0.5rem 1.5rem" 
              }}
            >
              {starting ? "Launching..." : balance !== null && balance < 100 ? "🪙 Need 100 coins" : "⚔️ Enter Battle"}
              {!(balance !== null && balance < 100) && <ArrowRight size={14} />}
            </button>
          </div>

          {error && (
            <p style={{ fontSize: "0.8125rem", color: "var(--coral)", padding: "0.625rem 0.875rem", borderRadius: "var(--r-md)", background: "var(--coral-dim)", border: "1px solid rgba(255, 77, 106, 0.2)" }}>{error}</p>
          )}

          {balance !== null && balance < 100 && !error && (
            <div style={{ fontSize: "0.8125rem", color: "var(--amber)", padding: "0.75rem 1rem", borderRadius: "var(--r-md)", background: "rgba(255, 187, 0, 0.08)", border: "1px solid rgba(255, 187, 0, 0.2)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p style={{ fontWeight: 800 }}>⚠️ Insufficient Balance</p>
              <p style={{ fontSize: "0.75rem", color: "var(--t2)" }}>You need 100 coins to start a game. Complete battles to earn more coins!</p>
              <p style={{ fontSize: "0.75rem", color: "var(--t3)" }}>Current balance: {balance} coins · Need: {100 - balance} more</p>
            </div>
          )}
        </div>
      </section>

      {/* ── RIGHT: PREVIEW ─────────────────────────── */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <section className="game-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <div className="dot-live" />
            <p className="eyebrow" style={{ color: "var(--lime)" }}>Battle Preview</p>
          </div>

          {preview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="glass-pill" style={{ padding: "1rem", border: "1px solid var(--border-default)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{preview.asset.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--t3)", marginTop: "0.25rem" }}>{preview.mode === "agent" ? "🤖 Agent" : "🎮 Human"}</p>
                  </div>
                  <span className={`badge ${preview.source === "pyth-history" ? "badge-pyth" : "badge-n"}`}>{preview.source === "pyth-history" ? "Pyth" : "Synthetic"}</span>
                </div>
                <div className="grid-2col" style={{ gap: "0.625rem" }}>
                  <div className="glass-pill" style={{ padding: "0.75rem" }}>
                    <p className="metric-label">End Price</p>
                    <p className="metric" style={{ fontSize: "1.25rem", fontWeight: 800 }}>{formatCurrency(preview.summary.endPrice)}</p>
                    <p className="metric" style={{ fontSize: "0.6875rem", color: preview.summary.changePct >= 0 ? "var(--lime)" : "var(--coral)" }}>{formatPercent(preview.summary.changePct)}</p>
                  </div>
                  <div className="glass-pill" style={{ padding: "0.75rem" }}>
                    <p className="metric-label">Volatility</p>
                    <p className="metric" style={{ fontSize: "1.25rem", fontWeight: 800 }}>{preview.summary.volatilityPct.toFixed(1)}%</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--t3)" }}>{preview.checkpoints.length} checkpoints</p>
                  </div>
                </div>
              </div>

              {/* Checkpoints as mission waypoints */}
              {preview.checkpoints.map((cp, i) => (
                <div key={cp.id} className="glass-pill" style={{ padding: "0.875rem", border: "1px solid var(--border-default)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--pyth-dim)", border: "1px solid var(--pyth)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 800, color: "var(--pyth-bright)" }}>{i + 1}</span>
                      {cp.title}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--t2)", lineHeight: 1.5 }}>{cp.prompt}</p>
                  <p className="metric" style={{ fontSize: "0.6875rem", color: "var(--lime)", marginTop: "0.375rem" }}>Best: {ACTION_LABELS[cp.expectedBestAction]}</p>
                </div>
              ))}

              {/* Boss Fight Card */}
              <div className="boss-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <Skull size={14} color="var(--coral)" />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--coral)", textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ Boss Fight</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--t2)", lineHeight: 1.5 }}>{preview.shockEvent.effectDescription}</p>
              </div>

              {livePrice && (
                <div style={{ padding: "0.875rem", borderRadius: "var(--r-lg)", background: "var(--lime-dim)", border: "1px solid rgba(170, 255, 0, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--lime)" }}>📡 Live Feed</span>
                    <span className="badge badge-g" style={{ fontSize: "0.5625rem" }}>Hermes</span>
                  </div>
                  <p className="metric" style={{ fontSize: "1rem", fontWeight: 800 }}>{formatCurrency(livePrice.price)}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "2.5rem", textAlign: "center", borderRadius: "var(--r-lg)", border: "1px dashed var(--border-default)", color: "var(--t3)", fontSize: "0.875rem" }}>
              {loadingPreview ? <><RefreshCw size={14} className="animate-spin" /> Generating preview...</> : "Preview will appear here."}
            </div>
          )}
        </section>

        <section className="game-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Brain size={14} color="var(--pyth-bright)" />
            <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>Score Engine</span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {["Decision quality at each checkpoint vs. optimal path.", "Timing precision — how much clock you leave unused.", "Risk discipline against your own max loss and cooldown rules.", "Adaptability when the boss shock distorts the tape."].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--t2)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--lime)", marginTop: "0.125rem", flexShrink: 0 }}>▸</span>{item}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
