"use client";

import { useState } from "react";
import { Flame, Coins, X, Check, Lock, Sparkles, TrendingUp } from "lucide-react";

type DayReward = {
  day: number;
  coins: number;
  multiplier: number;
};

const DAILY_REWARDS: DayReward[] = [
  { day: 1, coins: 100, multiplier: 2 },
  { day: 2, coins: 150, multiplier: 4 },
  { day: 3, coins: 200, multiplier: 6 },
  { day: 4, coins: 250, multiplier: 8 },
  { day: 5, coins: 300, multiplier: 10 },
  { day: 6, coins: 350, multiplier: 12 },
  { day: 7, coins: 500, multiplier: 14 },
];

export function StreakShop({ balance, currentStreak, onClose }: { balance: number; currentStreak: number; onClose: () => void }) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localStreak, setLocalStreak] = useState(currentStreak);

  async function handleClaim(day: number) {
    // Prevent claiming if already claimed
    if (day <= localStreak) {
      setError(`Day ${day} already claimed!`);
      return;
    }

    // Prevent claiming out of order
    if (day !== localStreak + 1) {
      setError(`Claim days in order! Next: Day ${localStreak + 1}`);
      return;
    }

    // Prevent double-clicking
    if (claiming) {
      return;
    }

    setClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/streak-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim reward");
      }

      const reward = DAILY_REWARDS[day - 1];
      setSuccess(`Day ${day} claimed! +${reward.coins} coins earned`);
      
      // Update local streak immediately to prevent re-claiming
      setLocalStreak(day);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
      setClaiming(false);
    }
  }

  const progress = (localStreak / 7) * 100;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(10, 10, 27, 0.97)",
      backdropFilter: "blur(8px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      animation: "fadeIn 0.3s ease",
    }}>
      <div className="game-panel" style={{
        maxWidth: "800px",
        width: "100%",
        padding: "0",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(109, 40, 217, 0.3)",
      }}>
        {/* Glow effects */}
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "-20%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(255, 187, 0, 0.15), transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(109, 40, 217, 0.2), transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }} />

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            color: "var(--t2)",
            padding: "0.5rem",
            zIndex: 10,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--t1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "var(--t2)";
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{
          padding: "2.5rem 2.5rem 2rem",
          background: "linear-gradient(180deg, rgba(255, 187, 0, 0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255, 187, 0, 0.1)",
          position: "relative",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "var(--r-xl)",
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(255, 187, 0, 0.4)",
              position: "relative",
            }}>
              <Flame size={36} color="#0A0A1B" strokeWidth={2.5} />
              <div style={{
                position: "absolute",
                inset: -4,
                borderRadius: "var(--r-xl)",
                background: "linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.3))",
                filter: "blur(12px)",
                zIndex: -1,
              }} />
            </div>
          </div>

          <h2 style={{
            fontSize: "2rem",
            fontWeight: 800,
            marginBottom: "0.5rem",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--gold), var(--amber))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            7-Day Streak Challenge
          </h2>
          <p style={{
            color: "var(--t3)",
            fontSize: "1rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}>
            Claim daily rewards and unlock powerful multipliers
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--amber)" }}>
                Day {localStreak} / 7
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--t3)" }}>
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div style={{
              height: 8,
              borderRadius: "var(--r-full)",
              background: "rgba(255, 187, 0, 0.1)",
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--gold), var(--amber))",
                borderRadius: "var(--r-full)",
                transition: "width 0.5s ease",
                boxShadow: "0 0 12px rgba(255, 187, 0, 0.5)",
              }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "var(--r-full)",
              background: "rgba(109, 40, 217, 0.15)",
              border: "1px solid rgba(109, 40, 217, 0.3)",
            }}>
              <Coins size={18} color="var(--pyth-bright)" />
              <span style={{ fontWeight: 800, color: "var(--pyth-bright)", fontSize: "1rem" }}>
                {balance.toLocaleString()}
              </span>
            </div>
            {localStreak > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "var(--r-full)",
                background: "rgba(255, 187, 0, 0.15)",
                border: "1px solid rgba(255, 187, 0, 0.3)",
              }}>
                <TrendingUp size={18} color="var(--amber)" />
                <span style={{ fontWeight: 800, color: "var(--amber)", fontSize: "1rem" }}>
                  ×{DAILY_REWARDS[localStreak - 1]?.multiplier || 2}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "2.5rem" }}>
          {error && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--r-lg)",
              background: "rgba(255, 77, 106, 0.1)",
              border: "1px solid rgba(255, 77, 106, 0.3)",
              color: "var(--coral)",
              fontSize: "0.9375rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--r-lg)",
              background: "rgba(170, 255, 0, 0.1)",
              border: "1px solid rgba(170, 255, 0, 0.3)",
              color: "var(--lime)",
              fontSize: "0.9375rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <Sparkles size={18} />
              {success}
            </div>
          )}

          {/* Calendar Grid */}
          <div style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "0 0.5rem",
          }}>
            {DAILY_REWARDS.map((reward) => {
              const isClaimed = reward.day <= localStreak;
              const isNext = reward.day === localStreak + 1;
              const isLocked = reward.day > localStreak + 1;

              return (
                <button
                  key={reward.day}
                  onClick={() => {
                    if (isNext && !claiming) {
                      handleClaim(reward.day);
                    }
                  }}
                  disabled={isClaimed || isLocked || claiming}
                  style={{
                    width: "110px",
                    height: "110px",
                    padding: "1rem",
                    borderRadius: "1.25rem",
                    background: isClaimed
                      ? "linear-gradient(135deg, rgba(170, 255, 0, 0.25), rgba(134, 239, 172, 0.12))"
                      : isNext
                      ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 187, 0, 0.15))"
                      : "linear-gradient(135deg, rgba(40, 40, 90, 0.8), rgba(25, 25, 60, 0.6))",
                    border: `3px solid ${
                      isClaimed
                        ? "rgba(170, 255, 0, 0.7)"
                        : isNext
                        ? "rgba(255, 215, 0, 0.8)"
                        : "rgba(100, 100, 140, 0.4)"
                    }`,
                    cursor: isNext && !claiming ? "pointer" : "not-allowed",
                    opacity: isLocked ? 0.5 : 1,
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isClaimed
                      ? "0 8px 32px rgba(170, 255, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.15)"
                      : isNext
                      ? "0 12px 40px rgba(255, 215, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)"
                      : "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    pointerEvents: (isNext && !claiming) ? "auto" : "none",
                  }}
                  onMouseOver={(e) => {
                    if (isNext && !claiming) {
                      e.currentTarget.style.transform = "translateY(-8px) scale(1.08)";
                      e.currentTarget.style.boxShadow = "0 20px 60px rgba(255, 215, 0, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.3)";
                      e.currentTarget.style.borderColor = "rgba(255, 215, 0, 1)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = isNext
                      ? "0 12px 40px rgba(255, 215, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)"
                      : isClaimed
                      ? "0 8px 32px rgba(170, 255, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.15)"
                      : "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = isNext
                      ? "rgba(255, 215, 0, 0.8)"
                      : isClaimed
                      ? "rgba(170, 255, 0, 0.7)"
                      : "rgba(100, 100, 140, 0.4)";
                  }}
                >
                  {/* Animated glow for active */}
                  {isNext && (
                    <>
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.4), transparent 70%)",
                        animation: "pulse 2.5s ease-in-out infinite",
                      }} />
                      <div style={{
                        position: "absolute",
                        inset: -6,
                        borderRadius: "1.25rem",
                        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.5), rgba(255, 165, 0, 0.5))",
                        filter: "blur(14px)",
                        zIndex: -1,
                        animation: "pulse 2.5s ease-in-out infinite",
                      }} />
                    </>
                  )}

                  {/* Diagonal shine effect */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent)",
                    borderRadius: "1.25rem 1.25rem 0 0",
                  }} />

                  {/* Status icon */}
                  <div style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isClaimed
                      ? "linear-gradient(135deg, #AAFF00, #7FFF00)"
                      : isLocked
                      ? "rgba(100, 100, 140, 0.7)"
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isClaimed ? "0 0 20px rgba(170, 255, 0, 0.8)" : "none",
                    border: isClaimed ? "2px solid rgba(0, 0, 0, 0.3)" : "none",
                  }}>
                    {isClaimed ? (
                      <Check size={16} color="#0A0A1B" strokeWidth={4} />
                    ) : isLocked ? (
                      <Lock size={14} color="var(--t4)" strokeWidth={3} />
                    ) : null}
                  </div>

                  {/* Day number */}
                  <div style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    marginBottom: "0.25rem",
                    color: isClaimed ? "#AAFF00" : isNext ? "#FFD700" : "var(--t4)",
                    textShadow: isClaimed
                      ? "0 0 25px rgba(170, 255, 0, 1), 0 2px 4px rgba(0, 0, 0, 0.5)"
                      : isNext
                      ? "0 0 30px rgba(255, 215, 0, 1), 0 2px 4px rgba(0, 0, 0, 0.5)"
                      : "0 2px 4px rgba(0, 0, 0, 0.5)",
                    position: "relative",
                    lineHeight: 1,
                    fontFamily: "var(--font-display)",
                  }}>
                    {reward.day}
                  </div>

                  {/* Coins */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 800,
                    color: isClaimed ? "#AAFF00" : isNext ? "#FFD700" : "var(--t2)",
                    marginBottom: "0.375rem",
                    textShadow: isClaimed || isNext ? "0 0 10px currentColor" : "none",
                  }}>
                    <Coins size={14} strokeWidth={2.5} />
                    {reward.coins}
                  </div>

                  {/* Multiplier badge */}
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    padding: "0.25rem 0.625rem",
                    borderRadius: "var(--r-full)",
                    background: isClaimed
                      ? "linear-gradient(135deg, rgba(170, 255, 0, 0.4), rgba(170, 255, 0, 0.2))"
                      : isNext
                      ? "linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 187, 0, 0.2))"
                      : "rgba(100, 100, 140, 0.4)",
                    color: isClaimed ? "#AAFF00" : isNext ? "#FFD700" : "var(--t3)",
                    border: `2px solid ${
                      isClaimed
                        ? "rgba(170, 255, 0, 0.5)"
                        : isNext
                        ? "rgba(255, 215, 0, 0.5)"
                        : "rgba(100, 100, 140, 0.5)"
                    }`,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    boxShadow: isClaimed || isNext ? "0 0 15px currentColor" : "none",
                  }}>
                    ×{reward.multiplier}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info box */}
          <div style={{
            padding: "1.25rem",
            borderRadius: "var(--r-lg)",
            background: "linear-gradient(135deg, rgba(109, 40, 217, 0.08), rgba(109, 40, 217, 0.03))",
            border: "1px solid rgba(109, 40, 217, 0.2)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}>
              <Sparkles size={16} color="var(--pyth-bright)" />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--pyth-bright)" }}>
                How It Works
              </span>
            </div>
            <ul style={{
              paddingLeft: "1.5rem",
              margin: 0,
              fontSize: "0.875rem",
              color: "var(--t3)",
              lineHeight: 1.8,
            }}>
              <li>Claim each day in order to build your streak</li>
              <li>Earn coins and unlock higher multipliers</li>
              <li>Complete all 7 days for maximum ×14 multiplier</li>
              <li>Miss a day and your streak resets to Day 1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
