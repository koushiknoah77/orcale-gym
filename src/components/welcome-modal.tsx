"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Sparkles, Zap, X } from "lucide-react";
import { useWalletSession } from "@/components/wallet-connect-provider";

/* ── Confetti canvas ─────────────────────────────────────────── */
function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = ["#AAFF00", "#6D28D9", "#FFD700", "#FF4D6A", "#38BDF8", "#fff"];
    const pts = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 5,
      vy: 3 + Math.random() * 5,
      r: 5 + Math.random() * 7,
      color: cols[Math.floor(Math.random() * cols.length)] ?? "#fff",
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 10,
    }));
    let frame = 0;
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.rotV;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - frame / 200);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
      }
      frame++;
      if (frame < 220) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, zIndex: 10001,
      pointerEvents: "none", width: "100%", height: "100%",
    }} />
  );
}

/* ── Main modal ──────────────────────────────────────────────── */
type WelcomeModalProps = {
  visible: boolean;
  balance: number;
  streakMultiplier: number;
  onDismiss: () => void;
};

export function WelcomeModal({ visible, balance, streakMultiplier, onDismiss }: WelcomeModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = window.setTimeout(() => setShow(true), 200);
      return () => window.clearTimeout(t);
    }
    setShow(false);
  }, [visible]);

  if (!visible && !show) return null;

  return (
    <>
      <Confetti active={show} />
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(10, 10, 27, 0.85)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "backdrop-in 0.3s ease-out",
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(145deg, rgba(109,40,217,0.18), rgba(10,10,27,0.95))",
            border: "1px solid rgba(109,40,217,0.4)",
            borderRadius: "var(--r-2xl, 20px)",
            padding: "3rem 2.5rem",
            maxWidth: 480,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 0 80px rgba(109,40,217,0.3), 0 0 0 1px rgba(170,255,0,0.08)",
            position: "relative",
            animation: "card-in 0.45s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--t3)", padding: "0.25rem",
            }}
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--pyth), var(--lime))",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 0 40px rgba(109,40,217,0.5)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}>
            <Zap size={36} color="#fff" strokeWidth={2.5} />
          </div>

          <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--lime)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            🎉 Welcome to Oracle Gym
          </p>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            Your journey begins!
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--t2)", lineHeight: 1.6, marginBottom: "2rem" }}>
            Wallet connected. You've been granted your starting coins to begin training.
          </p>

          {/* Coins reward */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.75rem",
            background: "linear-gradient(135deg, rgba(109,40,217,0.25), rgba(170,255,0,0.08))",
            border: "1px solid rgba(109,40,217,0.4)",
            borderRadius: "var(--r-xl, 14px)",
            padding: "1.25rem 2rem",
            marginBottom: "2rem",
          }}>
            <Coins size={28} color="var(--pyth-bright)" />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1, color: "var(--pyth-bright)", fontFamily: "var(--font-mono)" }}>
                +{balance.toLocaleString()}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--t3)", marginTop: "0.25rem" }}>starting coins</p>
            </div>
          </div>

          {/* Streak info */}
          <div style={{
            background: "rgba(255,187,0,0.07)",
            border: "1px solid rgba(255,187,0,0.2)",
            borderRadius: "var(--r-lg, 12px)",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            textAlign: "left",
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--amber)", marginBottom: "0.5rem" }}>
              🔥 7-Day Streak Multiplier System
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[
                ["Day 1", "×2 coins"],
                ["Day 2", "×4 coins"],
                ["Day 3", "×6 coins"],
                ["Day 4–7", "×8 → ×14 coins"],
              ].map(([day, mult]) => (
                <div key={day} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--t2)" }}>
                  <span>{day}</span>
                  <span style={{ fontWeight: 800, color: "var(--lime)" }}>{mult}</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--t4)" }}>
              Each game costs 100 coins · Win to earn coins back (+ streak bonus!)
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: "100%", padding: "0.875rem",
              background: "linear-gradient(135deg, var(--pyth), #8B5CF6)",
              border: "none", borderRadius: "var(--r-full)",
              color: "#fff", fontWeight: 800, fontSize: "1rem",
              cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 0 24px rgba(109,40,217,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(109,40,217,0.6)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(109,40,217,0.4)"; }}
          >
            <Sparkles size={16} />
            Enter the Arena
          </button>
        </div>
      </div>

      <style>{`
        @keyframes backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes card-in {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 20px rgba(109,40,217,0.5); }
          50%      { box-shadow: 0 0 40px rgba(109,40,217,0.8), 0 0 20px rgba(170,255,0,0.2); }
        }
      `}</style>
    </>
  );
}
