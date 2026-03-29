"use client";

import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BrainCircuit, LoaderCircle, Play, Pause, Shield, Skull, Sparkles, Swords, TimerReset, Zap } from "lucide-react";
import { CandlestickChart } from "@/components/candlestick-chart";
import { Orderbook } from "@/components/orderbook";
import { ACTION_LABELS, ACTION_OPTIONS } from "@/lib/constants";
import type { Action, Checkpoint, ReplaySession } from "@/lib/types";
import { formatCurrency, makeSeededRandom } from "@/lib/utils";

type ReplayLabProps = { sessionId: string };
type SessionResponse = { session: ReplaySession; userBalance: number };
type DecisionResponse = { session: ReplaySession; userBalance: number };

type ToastKind = "correct" | "wrong" | "timeout" | "daily";
type Toast = { kind: ToastKind; msg: string; coins?: number };

function buildAgentDecision(session: ReplaySession, checkpoint: Checkpoint) {
  const random = makeSeededRandom(`${session.id}-${session.scenario.seed}-${checkpoint.id}`);
  const candle = session.scenario.candles[checkpoint.candleIndex];
  const relConf = candle ? (candle.confidence ?? 0) / candle.close : 0.001;
  const missChance = (session.scenario.difficulty === "chaos" ? 0.34 : 0.2) + (relConf > 0.002 ? 0.15 : 0);
  const useBest = random() >= missChance;
  const fallbackIdx = Math.floor(random() * Math.max(checkpoint.fallbackActions.length, 1));
  const action = useBest ? checkpoint.expectedBestAction : checkpoint.fallbackActions[fallbackIdx] ?? "wait";
  return {
    action,
    confidence: (useBest ? 74 : 58) + Math.round(random() * 14),
    timerRemaining: 5 + Math.floor(random() * 5),
    reason: `Agent chose ${ACTION_LABELS[action].toLowerCase()} after scoring ${checkpoint.title.toLowerCase()}.`,
  };
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass-pill" style={{ padding: "1rem 1.25rem" }}>
      <p className="metric-label">{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <p className="metric" style={{ fontSize: "1.75rem", fontWeight: 800, color: accent ?? "var(--t1)", lineHeight: 1 }}>{value}</p>
        {sub && <p className="metric" style={{ fontSize: "0.6875rem", color: "var(--t3)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function TimerRing({ seconds, max }: { seconds: number; max: number }) {
  const r = 24, c = 2 * Math.PI * r;
  const pct = seconds / max;
  const color = seconds <= 3 ? "var(--coral)" : "var(--lime)";
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ flexShrink: 0 }}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--elevated)" strokeWidth="4" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${c}`} strokeDashoffset={`${c * (1 - pct)}`}
        strokeLinecap="round" transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
      />
      <text x="30" y="34" textAnchor="middle" fill={color} fontSize="16" fontWeight="800" fontFamily="var(--font-mono)">{seconds}</text>
    </svg>
  );
}

const ACTION_EMOJIS: Record<string, string> = { buy: "📈", sell: "📉", hold: "🛡️", reduce: "⬇️", wait: "⏳", hedge: "🔄" };

export function ReplayLab({ sessionId }: ReplayLabProps) {
  const router = useRouter();
  const [session, setSession] = useState<ReplaySession | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [running, setRunning] = useState(true);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [timer, setTimer] = useState(12);
  const [confidence, setConfidence] = useState(72);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoFinishing, setAutoFinishing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [shakeConsole, setShakeConsole] = useState(false);
  const [ownershipVerified, setOwnershipVerified] = useState(false);

  function showToast(t: Toast) {
    setToast(t);
    window.setTimeout(() => setToast(null), 2500);
  }

  // ── Load session and verify ownership ────────────
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as SessionResponse;
        if (!ignore) { 
          setSession(json.session); 
          setUserBalance(json.userBalance); 
          setVisibleCount(Math.min(8, json.session.scenario.candles.length));
          setOwnershipVerified(true);
        }
      } catch { if (!ignore) setError("Session could not be loaded."); }
      finally { if (!ignore) setIsLoading(false); }
    }
    void load();
    return () => { ignore = true; };
  }, [sessionId]);

  const checkpoints = session?.scenario.checkpoints ?? [];
  const decisions = session?.decisions ?? [];
  const currentCpIdx = checkpoints.findIndex((cp) => !decisions.some((d) => d.checkpointId === cp.id));
  const shockVisible = typeof session?.scenario.shockEvent.candleIndex === "number" && visibleCount > session.scenario.shockEvent.candleIndex;
  const allResolved = session !== null && checkpoints.every((cp) => decisions.some((d) => d.checkpointId === cp.id));
  const runFinished = session !== null && visibleCount >= session.scenario.candles.length && allResolved;
  const entropyWaiting = Boolean(session?.entropy?.enabled) && ["idle", "requesting", "pending"].includes(session?.entropy?.status ?? "");

  const currentPrice = session?.scenario.candles[visibleCount - 1]?.close ?? 0;
  let exposure = 0, lastEntry = 0;
  decisions.forEach((d) => {
    if (d.action === "buy") exposure += 1; else if (d.action === "sell") exposure -= 1; else if (d.action === "hedge") exposure = 0;
    lastEntry = session?.scenario.candles[d.candleIndex]?.close ?? lastEntry;
  });
  const pnlPct = exposure === 0 ? 0 : ((currentPrice - lastEntry) / lastEntry) * 100 * exposure;

  const eventLog: string[] = [];
  const nextCp = checkpoints[currentCpIdx];
  if (nextCp) eventLog.push(`⚔️ Incoming: ${nextCp.title}`);
  if (exposure !== 0) eventLog.push(`${exposure > 0 ? "📈" : "📉"} Position: ${exposure > 0 ? "Long" : "Short"} (${pnlPct.toFixed(2)}% PnL)`);
  if (session?.entropy?.enabled) eventLog.push(`⚡ Entropy: ${session.entropy.status}`);
  if (shockVisible && session) eventLog.push(`💀 Boss: ${session.scenario.shockEvent.shockType}`);
  decisions.forEach((d) => eventLog.push(`${ACTION_EMOJIS[d.action] ?? "▸"} ${ACTION_LABELS[d.action]} (${d.confidence}%)`));

  const advanceReplay = useEffectEvent(() => {
    if (!session || activeCheckpoint || autoFinishing) return;
    const next = Math.min(visibleCount + 1, session.scenario.candles.length);
    const cp = session.scenario.candles[next - 1]?.close ?? 0;
    let exp = 0, le = 0;
    decisions.forEach((d) => { const p = session.scenario.candles[d.candleIndex]?.close ?? 0; if (d.action === "buy") exp += 1; else if (d.action === "sell") exp -= 1; else if (d.action === "hedge") exp = 0; le = p; });
    const pnl = exp === 0 ? 0 : ((cp - le) / le) * 100 * exp;
    if (exp !== 0 && pnl <= -session.scenario.riskRules.maxLossPct) {
      setRunning(false); setError(`💀 Auto-Liquidation at ${formatCurrency(cp)} — hit ${session.scenario.riskRules.maxLossPct}% drawdown limit.`); setVisibleCount(next); return;
    }
    const pending = session.scenario.checkpoints.find((c) => c.candleIndex < next && !decisions.some((d) => d.checkpointId === c.id));
    if (pending) { setRunning(false); setActiveCheckpoint(pending); setTimer(12); }
    else if (next >= session.scenario.candles.length) setRunning(false);
    setVisibleCount(next);
  });

  useEffect(() => { if (!session || !running || activeCheckpoint || autoFinishing) return; const t = window.setTimeout(() => advanceReplay(), 720); return () => window.clearTimeout(t); }, [activeCheckpoint, autoFinishing, running, session, visibleCount]);

  useEffect(() => {
    if (!session?.entropy?.enabled || !["idle", "requesting", "pending"].includes(session.entropy.status)) return;
    let ignore = false; const sid = session.id;
    async function sync() { try { const res = await fetch(`/api/sessions/${sid}/entropy`, { method: "POST" }); if (!res.ok) throw new Error(); const json = (await res.json()) as SessionResponse; if (!ignore) { setSession(json.session); setUserBalance(json.userBalance); } } catch { if (!ignore) setError("Entropy sync unavailable."); } }
    void sync(); const id = window.setInterval(() => void sync(), 5000);
    return () => { ignore = true; window.clearInterval(id); };
  }, [session?.entropy?.enabled, session?.entropy?.status, session?.id]);

  async function submitDecision(action: Action, remaining: number, draftReason: string, actor: "human" | "agent", decisionConfidence = confidence) {
    if (!session || !activeCheckpoint) return;
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkpointId: activeCheckpoint.id, action, confidence: decisionConfidence, reason: draftReason, timerRemaining: remaining, actor }) });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as DecisionResponse;

      // Toast feedback
      if (actor === "human") {
        const isBest = action === activeCheckpoint.expectedBestAction;
        const isFallback = activeCheckpoint.fallbackActions.includes(action);
        if (isBest) {
          showToast({ kind: "correct", msg: "Perfect call! Optimal move.", coins: Math.round(28 * 2.5) });
        } else if (isFallback) {
          showToast({ kind: "wrong", msg: "Acceptable — not the sharpest edge.", coins: Math.round(17 * 2.5) });
          setShakeConsole(true); window.setTimeout(() => setShakeConsole(false), 500);
        } else {
          showToast({ kind: "wrong", msg: `Wrong move! Best was: ${action !== activeCheckpoint.expectedBestAction ? activeCheckpoint.expectedBestAction.toUpperCase() : "HOLD"}`, coins: -5 });
          setShakeConsole(true); window.setTimeout(() => setShakeConsole(false), 500);
        }
        if (remaining === 0) {
          showToast({ kind: "timeout", msg: "Timer expired — auto-submitted WAIT.", coins: -3 });
        }
      }

      setSession(json.session); setUserBalance(json.userBalance); setReason(""); setConfidence(72); setActiveCheckpoint(null); setRunning(true);
    } catch { setError("Decision could not be recorded."); }
    finally { setIsSubmitting(false); }
  }

  const submitDecisionFromEffect = useEffectEvent(async (action: Action, remaining: number, draftReason: string, actor: "human" | "agent", dc?: number) => { await submitDecision(action, remaining, draftReason, actor, dc); });

  useEffect(() => { if (!activeCheckpoint || !session || session.scenario.mode !== "agent") return; const t = window.setTimeout(() => { const ag = buildAgentDecision(session, activeCheckpoint); void submitDecisionFromEffect(ag.action, ag.timerRemaining, ag.reason, "agent", ag.confidence); }, 1100); return () => window.clearTimeout(t); }, [activeCheckpoint, session]);
  useEffect(() => { if (!activeCheckpoint || !session || session.scenario.mode === "agent") return; const id = window.setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000); return () => window.clearInterval(id); }, [activeCheckpoint, session]);
  useEffect(() => { if (timer === 0 && activeCheckpoint && session?.scenario.mode === "human" && !isSubmitting && !autoFinishing) { void submitDecisionFromEffect("wait", 0, "Timer expired.", "human"); } }, [timer, activeCheckpoint, session, isSubmitting, autoFinishing]);

  useEffect(() => {
    if (!runFinished || !session || autoFinishing || entropyWaiting) return;
    let ignore = false; setAutoFinishing(true); const sid = session.id;
    void fetch(`/api/sessions/${sid}/score`, { method: "POST", keepalive: true }).catch(() => {});
    if (!ignore) startTransition(() => router.push(`/report/${sid}`));
    return () => { ignore = true; };
  }, [autoFinishing, entropyWaiting, router, runFinished, session]);

  if (isLoading) return (
    <div className="game-panel" style={{ minHeight: "20rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontSize: "0.875rem" }}>
        <LoaderCircle size={16} className="animate-spin" color="var(--pyth-bright)" /> Preparing arena...
      </div>
    </div>
  );

  if (!session) return (
    <div className="game-panel" style={{ padding: "2rem" }}>
      <p style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Session unavailable</p>
      <p style={{ fontSize: "0.875rem", color: "var(--t3)", marginBottom: "1.5rem" }}>{error ?? "This replay could not be found."}</p>
      <Link href="/gym" className="btn btn-primary btn-sm" style={{ padding: "0.5rem 1.25rem" }}>Return to arena</Link>
    </div>
  );

  const currentCandle = session.scenario.candles[Math.max(visibleCount - 1, 0)];

  return (
    <div className="grid-sidebar" style={{ gap: "1.25rem", position: "relative" }}>
      {/* ── TOAST ──────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "0.875rem 1.75rem",
          borderRadius: "var(--r-full)",
          background: toast.kind === "correct"
            ? "linear-gradient(135deg, rgba(170,255,0,0.18), rgba(170,255,0,0.08))"
            : "linear-gradient(135deg, rgba(255,77,106,0.18), rgba(255,77,106,0.08))",
          border: `1px solid ${toast.kind === "correct" ? "rgba(170,255,0,0.35)" : "rgba(255,77,106,0.35)"}`,
          backdropFilter: "blur(20px)",
          display: "flex", alignItems: "center", gap: "0.875rem",
          boxShadow: toast.kind === "correct" ? "0 0 30px rgba(170,255,0,0.15)" : "0 0 30px rgba(255,77,106,0.15)",
          animation: "slide-up 0.3s ease-out",
          minWidth: "280px", justifyContent: "space-between",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: "1.25rem" }}>
            {toast.kind === "correct" ? "✅" : toast.kind === "timeout" ? "⏰" : "❌"}
          </span>
          <span style={{
            fontSize: "0.875rem", fontWeight: 700,
            color: toast.kind === "correct" ? "var(--lime)" : "var(--coral)",
          }}>{toast.msg}</span>
          {toast.coins !== undefined && (
            <span style={{
              fontSize: "0.8125rem", fontWeight: 800, fontFamily: "var(--font-mono)",
              color: (toast.coins ?? 0) >= 0 ? "var(--lime)" : "var(--coral)",
              padding: "0.2rem 0.625rem",
              borderRadius: "var(--r-full)",
              background: (toast.coins ?? 0) >= 0 ? "rgba(170,255,0,0.1)" : "rgba(255,77,106,0.1)",
            }}>
              {(toast.coins ?? 0) >= 0 ? `+${toast.coins}` : toast.coins} XP
            </span>
          )}
        </div>
      )}
      {/* ── MAIN ─────────────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="game-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Swords size={18} color="var(--pyth-bright)" />
                <p className="eyebrow" style={{ color: "var(--pyth-bright)" }}>Battle Active</p>
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
                {session.scenario.asset.label} – {session.scenario.scenarioType.replace("-", " ")}
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--t3)" }}>
                {session.scenario.mode === "agent" ? "🤖 Agent" : "🎮 Human"} – {session.scenario.source}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button type="button" onClick={() => setRunning((r) => !r)} className="btn btn-outline btn-sm">
                {running ? <Pause size={14} /> : <Play size={14} />} {running ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            <StatBox label="Last Price" value={formatCurrency(currentCandle.close)} />
            <StatBox label="PnL" value={`${pnlPct.toFixed(2)}%`} sub={`Limit: -${session.scenario.riskRules.maxLossPct}%`} accent={pnlPct < 0 ? "var(--coral)" : "var(--lime)"} />
            <StatBox label="Checkpoint" value={`${Math.min(decisions.length + 1, checkpoints.length)}/${checkpoints.length}`} />
            <StatBox label="Boss" value={shockVisible ? "💀 Active" : "⏳ Armed"} accent={shockVisible ? "var(--coral)" : "var(--t1)"} />
            <StatBox label="Credits" value={String(userBalance)} accent="var(--pyth-bright)" />
          </div>
        </div>

        <CandlestickChart candles={session.scenario.candles} checkpoints={session.scenario.checkpoints} visibleCount={visibleCount} shockIndex={session.scenario.shockEvent.candleIndex} shockHidden={session.scenario.shockEvent.hidden} currentIndex={Math.max(visibleCount - 1, 0)} />

        {/* Event log */}
        <div className="game-card" style={{ padding: "1.25rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.75rem", color: "var(--pyth-bright)" }}>📋 Battle Log</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {eventLog.slice(0, 6).map((item, i) => (
              <div key={`${item}-${i}`} style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--r-sm)", background: "rgba(10, 10, 27, 0.5)", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--t2)", fontFamily: "var(--font-mono), monospace" }}>
                {item}
              </div>
            ))}
            {eventLog.length === 0 && <p style={{ fontSize: "0.8125rem", color: "var(--t3)" }}>⏳ Battle unfolding...</p>}
          </div>
        </div>
      </section>

      {/* ── SIDEBAR ───────────────────────────────── */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <Orderbook currentCandle={currentCandle} visibleCount={visibleCount} difficulty={session.scenario.difficulty} />

        {/* Decision Console — Ability Buttons */}
        <section className="game-panel" style={{ padding: "1.5rem", ...(shakeConsole ? { animation: "shake 0.5s ease-in-out" } : {}) }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <Swords size={16} color="var(--lime)" />
            <span className="eyebrow" style={{ color: "var(--lime)" }}>⚔️ Action Console</span>
            {activeCheckpoint && <div style={{ marginLeft: "auto" }}><TimerRing seconds={timer} max={12} /></div>}
          </div>

          {activeCheckpoint ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="glass-pill" style={{ padding: "1rem", border: "1px solid var(--border-default)", background: "rgba(109, 40, 217, 0.04)" }}>
                <p style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.5rem" }}>{activeCheckpoint.title}</p>
                <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--t2)" }}>{activeCheckpoint.prompt}</p>
                <p className="metric" style={{ fontSize: "0.6875rem", color: "var(--gold)", marginTop: "0.5rem" }}>⚡ Pressure: {activeCheckpoint.pressure}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {ACTION_OPTIONS.map((action) => (
                  <button key={action} type="button" disabled={isSubmitting || session.scenario.mode === "agent"} onClick={() => void submitDecision(action, timer, reason || "Manual decision", "human")} className="ability-btn">
                    <span style={{ fontSize: "1.25rem" }}>{ACTION_EMOJIS[action]}</span>
                    <span>{ACTION_LABELS[action]}</span>
                  </button>
                ))}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <span className="metric-label">Confidence</span>
                  <span className="metric" style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--pyth-bright)" }}>{confidence}%</span>
                </div>
                <input type="range" min={35} max={95} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} style={{ width: "100%" }} />
              </div>

              <div>
                <span className="metric-label" style={{ display: "block", marginBottom: "0.375rem" }}>Reason</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why this move?" className="field" style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.8125rem", resize: "vertical" }} />
              </div>
            </div>
          ) : runFinished ? (
            <div style={{ padding: "1.25rem", borderRadius: "var(--r-lg)", background: "var(--lime-dim)", border: "1px solid rgba(170, 255, 0, 0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <LoaderCircle size={14} className="animate-spin" color="var(--lime)" />
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--lime)" }}>{entropyWaiting ? "⚡ Waiting for Entropy..." : "🏆 Calculating score..."}</span>
              </div>
              {!entropyWaiting && <Link href={`/report/${session.id}`} className="btn btn-outline btn-sm" style={{ display: "inline-flex", padding: "0.375rem 0.75rem", marginTop: "0.5rem" }}>View Report</Link>}
            </div>
          ) : (
            <p style={{ fontSize: "0.8125rem", color: "var(--t3)", padding: "0.875rem", borderRadius: "var(--r-lg)", background: "rgba(10, 10, 27, 0.5)", border: "1px solid var(--border-subtle)" }}>⏳ Battle unfolding. Console activates at the next checkpoint.</p>
          )}
        </section>

        {/* Scenario guidance */}
        <section className="game-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <BrainCircuit size={16} color="var(--pyth-bright)" />
            <span className="eyebrow" style={{ color: "var(--pyth-bright)" }}>📖 Intel</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.8125rem", color: "var(--t2)", lineHeight: 1.6 }}>
            <p>{session.scenario.shockEvent.effectDescription}</p>
            <p style={{ color: "var(--t3)" }}>{session.scenario.marketContext.selectionReason}</p>
            <p style={{ color: "var(--gold)" }}>⚠️ {activeCheckpoint?.riskNote ?? "Stay patient until the tape asks for action."}</p>
          </div>
        </section>

        {/* Entropy V2 */}
        <section className="game-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Sparkles size={16} color="var(--gold)" />
            <span className="eyebrow" style={{ color: "var(--gold)" }}>⚡ Entropy V2</span>
            <span className={`badge ${session.entropy?.status === "fulfilled" ? "badge-g" : "badge-n"}`} style={{ marginLeft: "auto", fontSize: "0.5625rem" }}>{session.entropy?.status ?? "disabled"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--t2)" }}>
            <p>{session.entropy?.note ?? "Local fallback shock active."}</p>
            {session.entropy?.explorerUrl && <a href={session.entropy.explorerUrl} target="_blank" rel="noreferrer" style={{ color: "var(--pyth-bright)", fontWeight: 800, fontSize: "0.75rem" }}>Open Explorer →</a>}
          </div>
        </section>

        {error && (
          <div style={{ padding: "0.75rem", borderRadius: "var(--r-md)", background: "var(--coral-dim)", border: "1px solid rgba(255, 77, 106, 0.2)", display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--coral)" }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "0.125rem" }} />{error}
          </div>
        )}
      </aside>
    </div>
  );
}
