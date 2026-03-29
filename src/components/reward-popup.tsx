"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Flame, Sparkles, TrendingUp, X } from "lucide-react";

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
    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      r: 4 + Math.random() * 6,
      color: cols[Math.floor(Math.random() * cols.length)] ?? "#fff",
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
    }));
    let frame = 0;
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.rotV;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - frame / 180);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
      }
      frame++;
      if (frame < 200) raf = requestAnimationFrame(draw);
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

/* ── Main popup ──────────────────────────────────────────────── */
type RewardPopupProps = {
  visible: boolean;
  coinsEarned: number;
  streak: number;
  streakMultiplier: number;
  grade: string;
  score: number;
  onDismiss: () => void;
};

export function RewardPopup({ visible, coinsEarned, streak, streakMultiplier, grade, score, onDismiss }: RewardPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = window.setTimeout(() => setShow(true), 200);
      return () => window.clearTimeout(t);
    }
    setShow(false);
  }, [visible]);

  if (!visible && !show) return null;

  const gradeColor = grade === "S" || grade === "A" ? "var(--lime)" : grade === "B" ? "var(--amber)" : "var(--t2)";

  return (
    <>
      <Confetti active={show} />
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(10, 10, 27, 0.9)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "backdrop-in 0.3s ease-out",
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(145deg, rgba(109,40,217,0.2), rgba(10,10,27,0.95))",
            border: "1px solid rgba(109,40,217,0.5)",
            borderRadius: "var(--r-2xl, 20px)",
            padding: "2.5rem 2rem",
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 0 80px rgba(109,40,217,0.4), 0 0 0 1px rgba(170,255,0,0.1)",
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

          {/* Grade badge */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `linear-gradient(135deg, ${gradeColor}, var(--pyth))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
            boxShadow: `0 0 40px ${gradeColor}40`,
            animation: "pulse-glow 2s ease-in-out infinite",
          }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>{grade}</span>
          </div>

          <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--lime)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            🎉 Battle Complete!
          </p>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
            Victory Earned
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--t2)", marginBottom: "1.75rem" }}>
            Score: {score.toFixed(0)} points
          </p>

          {/* Coins reward */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.75rem",
            background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(170,255,0,0.1))",
            border: "1px solid rgba(109,40,217,0.5)",
            borderRadius: "var(--r-xl, 14px)",
            padding: "1rem 1.75rem",
            marginBottom: "1.5rem",
          }}>
            <Coins size={24} color="var(--pyth-bright)" />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, color: "var(--pyth-bright)", fontFamily: "var(--font-mono)" }}>
                +{coinsEarned.toLocaleString()}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--t3)", marginTop: "0.25rem" }}>coins earned</p>
            </div>
          </div>

          {/* Streak info */}
          {streak > 0 && (
            <div style={{
              background: "rgba(255,187,0,0.08)",
              border: "1px solid rgba(255,187,0,0.25)",
              borderRadius: "var(--r-lg, 12px)",
              padding: "0.875rem 1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Flame size={18} color="var(--amber)" />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--amber)" }}>
                    {streak} Day Streak!
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--t3)" }}>
                    ×{streakMultiplier} multiplier active
                  </p>
                </div>
              </div>
              <TrendingUp size={16} color="var(--lime)" />
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={onDismiss}
            style={{
              width: "100%", padding: "0.875rem",
              background: "linear-gradient(135deg, var(--pyth), #8B5CF6)",
              border: "none", borderRadius: "var(--r-full)",
              color: "#fff", fontWeight: 800, fontSize: "0.9375rem",
              cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 0 24px rgba(109,40,217,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(109,40,217,0.6)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(109,40,217,0.4)"; }}
          >
            <Sparkles size={16} />
            Continue Training
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
          0%,100% { box-shadow: 0 0 20px rgba(109,40,217,0.4); }
          50%      { box-shadow: 0 0 40px rgba(109,40,217,0.7), 0 0 20px rgba(170,255,0,0.3); }
        }
      `}</style>
    </>
  );
}
