"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Copy, Check, LoaderCircle, RotateCcw, Swords, Star, Trophy, Flame, Sparkles } from "lucide-react";
import type { ReplaySession, UserStats } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { RewardPopup } from "@/components/reward-popup";

type ReportViewProps = { sessionId: string };
type ReportResponse = { session: ReplaySession };

/* ─── Confetti particle ────────────────────────────────────────── */
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colours = ["#AAFF00", "#6D28D9", "#FFD700", "#FF4D6A", "#38BDF8"];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5 - canvas.height * 0.3,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      r: 4 + Math.random() * 6,
      color: colours[Math.floor(Math.random() * colours.length)] ?? "#AAFF00",
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      life: 1,
    }));

    let frame = 0;
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.99;
        p.rot += p.rotV;
        p.life -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
      }
      frame++;
      if (frame < 180) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, zIndex: 9998,
      pointerEvents: "none", width: "100%", height: "100%",
    }} />
  );
}

/* ─── Animated counter ─────────────────────────────────────────── */
function AnimCounter({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(eased * to));
      if (pct < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{val}</>;
}

/* ─── Score ring ───────────────────────────────────────────────── */
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 60, c = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "var(--lime)" : score >= 50 ? "var(--gold)" : "var(--coral)";
  return (
    <div style={{ position: "relative", width: 170, height: 170 }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        <defs>
          <linearGradient id="scoreGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pyth)" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx="85" cy="85" r={r} fill="none" stroke="var(--elevated)" strokeWidth="8" />
        <circle cx="85" cy="85" r={r} fill="none" stroke="url(#scoreGrad2)" strokeWidth="8"
          strokeDasharray={`${c}`} strokeDashoffset={`${c * (1 - pct)}`}
          strokeLinecap="round" transform="rotate(-90 85 85)"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p className="metric" style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1, color: "var(--t1)" }}>{score}</p>
        <p className="metric" style={{ fontSize: "1rem", fontWeight: 800, color: color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{grade}</p>
      </div>
    </div>
  );
}

/* ─── Score bar ────────────────────────────────────────────────── */
function ScoreBar({ label, value, max = 25, isReward, isNegative }: { label: string; value: number; max?: number; isReward?: boolean; isNegative?: boolean }) {
  const pct = Math.min(100, Math.abs(value) / max * 100);
  const barColor = isReward ? "var(--pyth)" : isNegative ? "var(--coral)" : "var(--lime)";
  return (
    <div className="glass-pill" style={{ padding: "1rem 1.25rem", background: isReward ? "var(--pyth-dim)" : "rgba(255,255,255,0.02)", border: isReward ? "1px solid rgba(109, 40, 217, 0.25)" : "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
        <span style={{ fontSize: "0.8125rem", color: isReward ? "var(--pyth-bright)" : "var(--t2)" }}>{label}</span>
        <span className="metric" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--t1)" }}>
          {isReward ? <AnimCounter to={value} /> : value}
          {isReward && <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--t3)" }}> coins</span>}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--elevated)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 1s ease-out", boxShadow: `0 0 8px ${barColor}` }} />
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export function ReportView({ sessionId }: ReportViewProps) {
  const [session, setSession] = useState<ReplaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [hasShownReward, setHasShownReward] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadReport() {
      setLoading(true); setError(null); setSession(null);
      try {
        const response = await fetch(`/api/sessions/${sessionId}/report`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const json = (await response.json()) as ReportResponse;
        if (!ignore) setSession(json.session);
      } catch { if (!ignore) setError("Report not available yet."); }
      finally { if (!ignore) setLoading(false); }
    }
    async function loadStats() {
      try {
        const res = await fetch("/api/user-stats");
        if (res.ok) setUserStats(await res.json());
      } catch { /* silent */ }
    }
    void loadReport();
    void loadStats();
    return () => { ignore = true; };
  }, [sessionId]);

  // Fire confetti on victory
  useEffect(() => {
    if (!session?.score) return;
    if (session.score.total >= 70) {
      const t = window.setTimeout(() => setConfettiActive(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [session?.score]);

  // Show reward popup on first load if coins were earned
  useEffect(() => {
    if (!session?.score || !userStats || hasShownReward) return;
    
    // Check if reward was already shown for this session
    const rewardShownKey = `reward-shown-${sessionId}`;
    const alreadyShown = sessionStorage.getItem(rewardShownKey);
    if (alreadyShown) return;
    
    const reward = session.reward ?? 0;
    if (reward > 0) {
      const t = window.setTimeout(() => {
        setShowRewardPopup(true);
        sessionStorage.setItem(rewardShownKey, 'true');
      }, 600);
      setHasShownReward(true);
      return () => window.clearTimeout(t);
    }
  }, [session?.score, userStats, hasShownReward, sessionId]);

  async function handleCopy() {
    if (!session?.score || !session.aiReport) return;
    const shareText = [`🏆 Pyth Oracle Gym`, `${session.scenario.asset.label} ${session.scenario.scenarioType} drill`, `Score: ${session.score.total}/100 (${session.score.grade})`, session.aiReport.summary, `Next drill: ${session.aiReport.nextDrill}`].join("\n");
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (loading) return (
    <div className="game-panel" style={{ padding: "5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "var(--t2)" }}>
        <LoaderCircle size={18} className="animate-spin" color="var(--pyth-bright)" /> Calculating final score...
      </div>
    </div>
  );

  if (!session || !session.score || !session.aiReport) return (
    <div className="game-panel" style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ fontSize: "1.125rem", fontWeight: 800 }}>Report unavailable</p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--t3)" }}>{error ?? "The run has not been scored yet."}</p>
      <div style={{ marginTop: "2rem" }}><Link href="/gym" className="btn btn-primary btn-sm" style={{ padding: "0.75rem 1.5rem" }}>Build a fresh scenario</Link></div>
    </div>
  );

  const isVictory = session.score.total >= 70;
  const reward = session.reward ?? 0;

  return (
    <>
      <ConfettiCanvas active={confettiActive} />
      <RewardPopup
        visible={showRewardPopup}
        coinsEarned={reward}
        streak={userStats?.streak ?? 0}
        streakMultiplier={userStats?.streakMultiplier ?? 2}
        grade={session.score.grade}
        score={session.score.total}
        onDismiss={() => setShowRewardPopup(false)}
      />
      <div className="grid-sidebar" style={{ gap: "2rem" }}>
        {/* ── LEFT: SCORE ────────────────────────────────── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="game-panel" style={{ padding: "2rem", position: "relative", overflow: "hidden" }}>
            {isVictory && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--lime), var(--gold), var(--lime))" }} />}

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
              <div>
                <p className="eyebrow" style={{ color: isVictory ? "var(--lime)" : "var(--coral)", marginBottom: "0.5rem" }}>{isVictory ? "🏆 Victory!" : "💀 Defeat"}</p>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {session.scenario.asset.label} – {session.scenario.scenarioType.replace("-", " ")}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                  <span className="badge badge-pyth" style={{ padding: "0.3rem 0.75rem" }}>🎭 {session.aiReport.archetype}</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--t2)" }}>{session.scenario.mode === "agent" ? "🤖 Agent" : "🎮 Human"} • {session.decisions.length} moves</span>
                </div>
              </div>
              <ScoreRing score={session.score.total} grade={session.score.grade} />
            </div>

            {/* Gamification reward row */}
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {reward > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "var(--r-full)", background: "var(--pyth-dim)", border: "1px solid rgba(109,40,217,0.3)" }}>
                  <Sparkles size={14} color="var(--pyth-bright)" />
                  <span className="metric" style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--pyth-bright)" }}>
                    +<AnimCounter to={reward} /> coins earned
                  </span>
                </div>
              )}
              {userStats && userStats.streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "var(--r-full)", background: "rgba(255,187,0,0.1)", border: "1px solid rgba(255,187,0,0.25)" }}>
                  <Flame size={14} color="var(--amber)" />
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--amber)" }}>
                    🔥 {userStats.streak} day streak!
                  </span>
                </div>
              )}
              {userStats?.dailyBonusAvailable === false && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "var(--r-full)", background: "rgba(170,255,0,0.08)", border: "1px solid rgba(170,255,0,0.2)" }}>
                  <Star size={14} color="var(--lime)" />
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--lime)" }}>Daily bonus +50 XP claimed!</span>
                </div>
              )}
            </div>

            <div className="grid-2col" style={{ marginTop: "2rem", gap: "0.75rem" }}>
              <ScoreBar label="⚔️ Decision Quality" value={session.score.decisionQuality} />
              <ScoreBar label="⏱️ Timing Precision" value={session.score.timingPrecision} />
              <ScoreBar label="🛡️ Risk Discipline" value={session.score.riskDiscipline} />
              <ScoreBar label="🔄 Adaptability" value={session.score.adaptability} />
              <ScoreBar label="📊 Consistency" value={session.score.consistency} />
              <ScoreBar label="💀 Penalties" value={session.score.penalties} max={10} isNegative />
              <ScoreBar label="⭐ Coins Earned" value={reward} max={300} isReward />
            </div>
          </div>

          {/* Coaching */}
          <div className="game-panel" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <Trophy size={18} color="var(--gold)" />
              <p style={{ fontSize: "1.125rem", fontWeight: 800 }}>🎓 Coach's Notes</p>
            </div>
            <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "var(--pyth-bright)", marginBottom: "1rem" }}>Archetype: {session.aiReport.archetypeDescription}</p>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--t2)", marginBottom: "1.5rem" }}>{session.aiReport.summary}</p>

            <div className="grid-2col" style={{ gap: "1rem" }}>
              <div style={{ padding: "1.25rem", borderRadius: "var(--r-xl)", background: "var(--lime-dim)", border: "1px solid rgba(170, 255, 0, 0.15)" }}>
                <p style={{ fontWeight: 800, color: "var(--lime)", marginBottom: "0.75rem" }}>✅ What went right</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--t2)" }}>
                  {session.aiReport.whatWentRight.map((item) => (<p key={item}>▸ {item}</p>))}
                </div>
              </div>
              <div style={{ padding: "1.25rem", borderRadius: "var(--r-xl)", background: "var(--coral-dim)", border: "1px solid rgba(255, 77, 106, 0.15)" }}>
                <p style={{ fontWeight: 800, color: "var(--coral)", marginBottom: "0.75rem" }}>❌ What went wrong</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--t2)" }}>
                  {session.aiReport.whatWentWrong.map((item) => (<p key={item}>▸ {item}</p>))}
                </div>
              </div>
            </div>

            <div className="glass-pill" style={{ marginTop: "1.5rem", padding: "1.25rem", border: "1px solid var(--border-default)" }}>
              <p style={{ fontWeight: 800 }}>🎯 Next Drill</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--t2)" }}>{session.aiReport.nextDrill}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--pyth-bright)" }}>{session.aiReport.verdict}</p>
            </div>
          </div>
        </section>

        {/* ── RIGHT: SIDEBAR ──────────────────────────────── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Optimal Path */}
          <section className="game-panel" style={{ padding: "2rem" }}>
            <p className="eyebrow" style={{ color: "var(--pyth-bright)", marginBottom: "1.5rem" }}>🗺️ Optimal Path Analysis</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {session.scenario.checkpoints.map((checkpoint) => {
                const decision = session.decisions.find((item) => item.checkpointId === checkpoint.id);
                const isMatch = decision?.action === checkpoint.expectedBestAction;
                return (
                  <div key={checkpoint.id} className="glass-pill" style={{ padding: "1.25rem", border: isMatch ? "1px solid rgba(170, 255, 0, 0.15)" : "1px solid var(--border-subtle)" }}>
                    <p style={{ fontWeight: 800, marginBottom: "0.5rem" }}>{checkpoint.title}</p>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--t2)", marginBottom: "0.75rem" }}>{checkpoint.context}</p>
                    <div className="grid-2col" style={{ gap: "0.625rem" }}>
                      <div style={{ borderRadius: "var(--r-sm)", border: "1px solid rgba(109, 40, 217, 0.2)", background: "var(--pyth-dim)", padding: "0.75rem" }}>
                        <p className="metric-label" style={{ color: "var(--pyth-bright)" }}>Best Move</p>
                        <p style={{ marginTop: "0.25rem", fontWeight: 800, fontSize: "0.875rem", textTransform: "capitalize" }}>✅ {checkpoint.expectedBestAction}</p>
                      </div>
                      <div style={{ borderRadius: "var(--r-sm)", border: `1px solid ${isMatch ? "rgba(170, 255, 0, 0.15)" : "rgba(255, 77, 106, 0.15)"}`, background: isMatch ? "var(--lime-dim)" : "var(--coral-dim)", padding: "0.75rem" }}>
                        <p className="metric-label" style={{ color: isMatch ? "var(--lime)" : "var(--coral)" }}>Your Move</p>
                        <p style={{ marginTop: "0.25rem", fontWeight: 800, fontSize: "0.875rem", textTransform: "capitalize" }}>{isMatch ? "✅" : "❌"} {decision?.action ?? "No action"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Share */}
          <section className="game-panel" style={{ padding: "2rem" }}>
            <p className="eyebrow" style={{ color: "var(--gold)", marginBottom: "1.5rem" }}>🏅 Share Card</p>
            <div style={{ padding: "1.5rem", borderRadius: "var(--r-xl)", background: "linear-gradient(135deg, var(--pyth-dim), var(--lime-dim))", border: "1px solid rgba(109, 40, 217, 0.2)" }}>
              <p className="metric" style={{ fontSize: "0.8125rem", color: "var(--pyth-bright)", fontWeight: 800 }}>🏆 Pyth Oracle Gym</p>
              <p style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{session.score.total}/100 <span style={{ fontSize: "1rem", color: "var(--t3)", fontWeight: 400 }}>on {session.scenario.asset.label}</span></p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--t2)" }}>{session.scenario.scenarioType.replace("-", " ")} drill · +{reward} coins</p>
              {userStats && userStats.streak > 0 && (
                <p style={{ marginTop: "0.375rem", fontSize: "0.8125rem", color: "var(--amber)", fontWeight: 800 }}>🔥 {userStats.streak} day streak</p>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button type="button" onClick={() => void handleCopy()} className="btn btn-primary" style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
              </button>
              <Link href="/gym" className="btn btn-lime" style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.875rem", display: "flex", justifyContent: "center" }}>
                <Swords size={16} /> Rematch
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
