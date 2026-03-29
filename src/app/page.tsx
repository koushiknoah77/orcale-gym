"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Zap, Target, Brain, Shield, ChevronRight, Sparkles, BarChart2, Trophy, Flame, Swords, Gamepad2, Star, Coins } from "lucide-react";
import { LiveMarketStrip } from "@/components/live-market-strip";
import { WelcomeModal } from "@/components/welcome-modal";
import { WalletGate } from "@/components/wallet-gate";
import { useWalletSession } from "@/components/wallet-connect-provider";
import { useEffect, useState } from "react";
import type { UserStats } from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: EASE } }),
};

const FEATURES = [
  { icon: Swords, color: "var(--pyth-bright)", bg: "var(--pyth-dim)", title: "Battle Replays", desc: "Step through real Pyth price windows. Each checkpoint is a decision battle — choose your move before the timer runs out." },
  { icon: Zap, color: "var(--coral)", bg: "var(--coral-dim)", title: "Boss Fights", desc: "On-chain Entropy V2 injects random shock events. Survive the boss fight to earn bonus XP and climb the ranks." },
  { icon: Brain, color: "var(--lime)", bg: "var(--lime-dim)", title: "Skill Scoring", desc: "Get graded on decision quality, timing, risk discipline and adaptability. Unlock trader archetypes and level up." },
];

const STATS = [
  { value: "6", label: "Battle Modes", icon: Gamepad2 },
  { value: "3", label: "Difficulty Tiers", icon: Star },
  { value: "∞", label: "Replay Variations", icon: Sparkles },
  { value: "100%", label: "Real Pyth Data", icon: Shield },
];

const STEPS = [
  { num: "01", title: "Choose Your Battle", desc: "Pick asset, scenario type, difficulty tier, and set your risk rules.", icon: Target, color: "var(--pyth-bright)" },
  { num: "02", title: "Enter the Arena", desc: "Replay the tape, make decisions at checkpoints, survive the entropy boss.", icon: Swords, color: "var(--lime)" },
  { num: "03", title: "Claim Your Score", desc: "Receive a scored report with archetype analysis, coaching, and XP rewards.", icon: Trophy, color: "var(--gold)" },
];

export default function HomePage() {
  const { isConnected } = useWalletSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    fetch("/api/user-stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { 
        if (d) {
          setStats(d as UserStats);
          // Show welcome modal for new users who just connected
          // Only show once per session using sessionStorage
          if (isConnected && (d as UserStats).isNewOwner) {
            const welcomeShown = sessionStorage.getItem('oracle-gym-welcome-shown');
            if (!welcomeShown) {
              setShowWelcome(true);
              sessionStorage.setItem('oracle-gym-welcome-shown', 'true');
            }
          }
        }
      })
      .catch(() => {});
  }, [isConnected]);

  const handleDismissWelcome = async () => {
    setShowWelcome(false);
    // Mark user as seen
    await fetch("/api/mark-seen", { method: "POST" }).catch(() => {});
  };

  const streak = stats?.streak ?? 0;
  const balance = stats?.balance ?? null;
  const dailyBonus = stats?.dailyBonusAvailable ?? false;
  const streakMultiplier = stats?.streakMultiplier ?? 2;

  return (
    <>
      <WelcomeModal 
        visible={showWelcome} 
        balance={balance ?? 1000} 
        streakMultiplier={streakMultiplier}
        onDismiss={handleDismissWelcome}
      />
      <main style={{ overflow: "hidden" }}>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ textAlign: "center", paddingTop: "5rem", paddingBottom: "4rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(109, 40, 217, 0.15), transparent 60%)", filter: "blur(80px)", pointerEvents: "none", zIndex: -1 }} />
        <div style={{ position: "absolute", top: "10%", right: "15%", width: "30vw", height: "30vw", background: "radial-gradient(circle, rgba(170, 255, 0, 0.06), transparent 60%)", filter: "blur(80px)", pointerEvents: "none", zIndex: -1 }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="badge badge-pyth" style={{ marginBottom: "1.5rem", padding: "0.4rem 1rem", fontSize: "0.75rem" }}>
              <Zap size={12} /> Powered by Pyth Network
            </span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: "0.5rem", marginBottom: "1.5rem" }}
          >
            Train Your Oracle{" "}<br />
            <span className="gradient-text" style={{ fontWeight: 800 }}>Skills in the Arena</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            style={{ fontSize: "1.125rem", color: "var(--t2)", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}
          >
            A gamified crypto training platform. Replay real markets, survive entropy shocks,
            earn XP, and level up your trading instincts — all powered by live Pyth data.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/gym">
              <button className="btn btn-lime btn-lg" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }}>
                <Swords size={18} /> Enter Arena
              </button>
            </Link>
            <Link href="/history">
              <button className="btn btn-outline btn-lg" style={{ padding: "1rem 2rem", fontSize: "1rem" }}>
                <Trophy size={16} /> View Rankings
              </button>
            </Link>
          </motion.div>

          {/* Streak callout */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "2rem", flexWrap: "wrap" }}
          >
            <Flame size={16} color="var(--amber)" />
            <span style={{ fontSize: "0.875rem", color: "var(--t3)" }}>Complete daily drills to build your streak</span>
            {streak > 0
              ? <span className="badge badge-amber">🔥 {streak} day streak</span>
              : <span className="badge badge-n">🔥 No streak — start one today!</span>
            }
            {dailyBonus && (
              <span className="badge badge-g"><Coins size={11} /> Daily bonus available!</span>
            )}
            {balance !== null && (
              <span className="badge badge-pyth"><Sparkles size={11} /> {balance.toLocaleString()} coins</span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <motion.section className="container" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
        style={{ paddingBottom: "5rem" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", maxWidth: "850px", margin: "0 auto" }}>
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={fadeUp} custom={i}
                className="game-card game-card-hover"
                style={{ textAlign: "center", padding: "1.5rem 1rem", cursor: "default" }}
              >
                <Icon size={20} color="var(--pyth-bright)" style={{ margin: "0 auto 0.75rem" }} />
                <p className="metric" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--lime)", lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--t3)", marginTop: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="container" style={{ paddingBottom: "6rem" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: "3rem" }}>
          <motion.p variants={fadeUp} custom={0} className="eyebrow" style={{ color: "var(--pyth-bright)", marginBottom: "0.75rem" }}>Game Modes</motion.p>
          <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Every Drill is a <span style={{ color: "var(--lime)" }}>Battle</span>
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp} custom={i} className="game-card game-card-hover" style={{ padding: "2.5rem 2rem", cursor: "default" }}>
                <div style={{ width: 52, height: 52, borderRadius: "var(--r-lg)", background: f.bg, border: `1px solid ${f.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                  <Icon size={24} color={f.color} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--t2)", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="container" style={{ paddingBottom: "6rem" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "3rem" }}>
          <motion.p variants={fadeUp} custom={0} className="eyebrow" style={{ color: "var(--lime)", marginBottom: "0.75rem" }}>How to Play</motion.p>
          <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>Three Rounds to Victory</motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", position: "relative" }}
        >
          <div style={{ position: "absolute", top: "44px", left: "16.5%", right: "16.5%", height: "2px", background: "linear-gradient(90deg, var(--pyth-dim), var(--lime-dim), var(--gold-dim))", zIndex: 0 }} />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.num} variants={fadeUp} custom={i} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", background: "var(--surface)",
                  border: `2px solid ${step.color}`, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.5rem", boxShadow: `0 0 25px ${step.color}33`,
                }}>
                  <Icon size={24} color={step.color} />
                </div>
                <span className="badge badge-pyth" style={{ marginBottom: "0.75rem", fontSize: "0.625rem" }}>Round {step.num}</span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--t3)", lineHeight: 1.6, maxWidth: "260px" }}>{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── DASHBOARD PREVIEW ───────────────────────────────── */}
      <section className="container" style={{ paddingBottom: "6rem", textAlign: "center" }}>
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          style={{ fontSize: "2.5rem", fontWeight: 600, marginBottom: "3rem", letterSpacing: "-0.03em" }}
        >
          Your Training <span style={{ color: "var(--t3)" }}>Dashboard</span>
        </motion.h2>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          style={{ position: "relative", width: "100%", maxWidth: "900px", margin: "0 auto" }}
        >
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(109, 40, 217, 0.12), transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div className="game-card animate-float" style={{ aspectRatio: "16/9", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px -20px rgba(0, 0, 0, 0.7), 0 0 50px var(--pyth-dim)" }}>
            <div style={{ height: "44px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 1.25rem", gap: "0.5rem", background: "rgba(10, 10, 27, 0.5)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--coral)", opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber)", opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--lime)", opacity: 0.6 }} />
              <span className="metric" style={{ fontSize: "0.6875rem", color: "var(--t4)", marginLeft: "1rem" }}>oracle-gym.pyth.network</span>
            </div>
            <div style={{ flex: 1, padding: "1.5rem", display: "flex", gap: "1rem" }}>
              {/* Left Large Box - Chart Preview */}
              <div style={{ flex: 1, border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", background: "rgba(10, 10, 27, 0.5)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Chart Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="eyebrow" style={{ fontSize: "0.5625rem", color: "var(--pyth-bright)", marginBottom: "0.25rem" }}>BATTLE MAP</div>
                    <div style={{ fontSize: "0.5rem", color: "var(--t4)", fontFamily: "monospace" }}>ETH/USD · 24 candles</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.5rem", color: "var(--t3)", padding: "0.25rem 0.5rem", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--lime)" }} />
                      <span>Bull</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.5rem", color: "var(--t3)", padding: "0.25rem 0.5rem", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--coral)" }} />
                      <span>Bear</span>
                    </div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div style={{ flex: 1, position: "relative", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", padding: "0.75rem" }}>
                  <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 240 100" preserveAspectRatio="none">
                    {/* Grid */}
                    <line x1="0" y1="25" x2="240" y2="25" stroke="rgba(109, 40, 217, 0.12)" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="240" y2="50" stroke="rgba(109, 40, 217, 0.18)" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="240" y2="75" stroke="rgba(109, 40, 217, 0.12)" strokeWidth="0.5" />
                    
                    {/* Candles - mix of green (bull) and red (bear) with ups and downs */}
                    {[
                      {x:15,h:48,l:62,o:60,c:50,bull:false},
                      {x:30,h:45,l:58,o:56,c:47,bull:false},
                      {x:45,h:42,l:50,o:48,c:44,bull:false},
                      {x:60,h:38,l:46,o:40,c:44,bull:true},
                      {x:75,h:35,l:43,o:37,c:41,bull:true},
                      {x:90,h:32,l:45,o:34,c:43,bull:true},
                      {x:105,h:38,l:50,o:48,c:40,bull:false},
                      {x:120,h:35,l:48,o:46,c:37,bull:false},
                      {x:135,h:32,l:40,o:38,c:34,bull:false},
                      {x:150,h:28,l:36,o:30,c:34,bull:true},
                      {x:165,h:30,l:42,o:40,c:32,bull:false},
                      {x:180,h:28,l:40,o:38,c:30,bull:false},
                      {x:195,h:25,l:33,o:27,c:31,bull:true},
                      {x:210,h:27,l:38,o:36,c:29,bull:false},
                      {x:225,h:24,l:35,o:33,c:26,bull:false}
                    ].map((c,i) => (
                      <g key={i} opacity={0.7 + (i / 15) * 0.3}>
                        <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={c.bull ? "var(--lime)" : "var(--coral)"} strokeWidth="1" />
                        <rect x={c.x-2.5} y={Math.min(c.o,c.c)} width="5" height={Math.max(Math.abs(c.c-c.o), 1)} fill={c.bull ? "var(--lime)" : "var(--coral)"} opacity="0.8" />
                      </g>
                    ))}
                    
                    {/* Trend line showing volatility */}
                    <path d="M 15 56 L 45 46 L 75 39 L 105 44 L 135 36 L 165 36 L 195 29 L 225 31" stroke="var(--pyth-bright)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" opacity="0.4" />
                  </svg>
                </div>
              </div>
              
              <div style={{ width: "35%", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Top Right Box - Performance Stats */}
                <div style={{ flex: 1, border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", background: "rgba(10, 10, 27, 0.5)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div className="eyebrow" style={{ fontSize: "0.5625rem", color: "var(--lime)", letterSpacing: "0.1em" }}>PERFORMANCE</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {/* Win Rate */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
                        <span style={{ fontSize: "0.5625rem", color: "var(--t2)", fontWeight: 600 }}>Win Rate</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--lime)", fontFamily: "monospace", fontWeight: 700 }}>67%</span>
                      </div>
                      <div style={{ height: "4px", background: "rgba(170, 255, 0, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: "67%", height: "100%", background: "linear-gradient(90deg, var(--lime), #C8FF50)", borderRadius: "2px" }} />
                      </div>
                    </div>
                    
                    {/* Accuracy */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
                        <span style={{ fontSize: "0.5625rem", color: "var(--t2)", fontWeight: 600 }}>Accuracy</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--pyth-bright)", fontFamily: "monospace", fontWeight: 700 }}>82%</span>
                      </div>
                      <div style={{ height: "4px", background: "rgba(109, 40, 217, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: "82%", height: "100%", background: "linear-gradient(90deg, var(--pyth), var(--pyth-bright))", borderRadius: "2px" }} />
                      </div>
                    </div>
                    
                    {/* Total Games */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontSize: "0.5625rem", color: "var(--t3)" }}>Total Games</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--t1)", fontFamily: "monospace", fontWeight: 700 }}>142</span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Right Box - Live Orderbook */}
                <div style={{ flex: 1, border: "1px solid var(--border-subtle)", borderRadius: "var(--r-lg)", background: "rgba(10, 10, 27, 0.5)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem", fontFamily: "monospace" }}>
                  <div className="eyebrow" style={{ fontSize: "0.5625rem", color: "var(--pyth-bright)", letterSpacing: "0.1em" }}>ORDERBOOK</div>
                  
                  {/* Asks */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {[{p:"2,145.80",s:"0.45",w:75},{p:"2,145.60",s:"0.32",w:60},{p:"2,145.40",s:"0.28",w:50}].map((a,i) => (
                      <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: "0.5625rem", padding: "0.25rem 0.5rem", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${a.w}%`, background: "rgba(255, 77, 106, 0.06)", transition: "width 0.3s ease" }} />
                        <span style={{ position: "relative", color: "var(--coral)", fontWeight: 600 }}>{a.p}</span>
                        <span style={{ position: "relative", color: "var(--t3)" }}>{a.s}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Current Price */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.375rem", background: "rgba(109, 40, 217, 0.12)", borderRadius: "4px", border: "1px solid rgba(109, 40, 217, 0.25)" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--pyth-bright)", fontWeight: 800, letterSpacing: "0.02em" }}>$2,145.20</span>
                  </div>
                  
                  {/* Bids */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {[{p:"2,145.00",s:"0.38",w:65},{p:"2,144.80",s:"0.51",w:80},{p:"2,144.60",s:"0.24",w:45}].map((b,i) => (
                      <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: "0.5625rem", padding: "0.25rem 0.5rem", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${b.w}%`, background: "rgba(170, 255, 0, 0.06)", transition: "width 0.3s ease" }} />
                        <span style={{ position: "relative", color: "var(--lime)", fontWeight: 600 }}>{b.p}</span>
                        <span style={{ position: "relative", color: "var(--t3)" }}>{b.s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── LIVE MARKET ──────────────────────────────────────── */}
      <section className="container" style={{ paddingBottom: "6rem" }}>
        <LiveMarketStrip assetKeys={["BTC", "ETH", "SOL"]} />
      </section>

      {/* ── CTA FOOTER ──────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border-default)", background: "rgba(18, 18, 43, 0.5)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--pyth), var(--lime))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 0 35px var(--pyth-glow)" }}
          >
            <Gamepad2 size={28} color="#0A0A1B" />
          </motion.div>
          <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem" }}
          >Ready to enter the arena?</motion.h3>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            style={{ color: "var(--t3)", marginBottom: "2rem", fontSize: "1rem", lineHeight: 1.6 }}
          >Your first drill is free. Start training and climb the leaderboard.</motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}>
            <Link href="/gym"><button className="btn btn-lime btn-lg" style={{ padding: "1rem 2.5rem" }}><Swords size={18} /> Start Training <ChevronRight size={16} /></button></Link>
          </motion.div>
        </div>
      </section>
    </main>
    </>
  );
}
