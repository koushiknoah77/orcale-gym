"use client";

import { Coins, Lock, Wallet, Zap } from "lucide-react";
import { useWalletSession } from "@/components/wallet-connect-provider";

export function WalletGate() {
  const { connect, status, isReady } = useWalletSession();

  async function handleConnect() {
    if (!isReady || status === "connecting") return;
    await connect();
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "4rem 2rem", textAlign: "center",
      background: "linear-gradient(145deg, rgba(109,40,217,0.06), rgba(10,10,27,0.4))",
      border: "1px dashed rgba(109,40,217,0.3)",
      borderRadius: "var(--r-xl, 14px)",
      gap: "1.5rem",
      minHeight: 320,
    }}>
      {/* Lock icon */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(109,40,217,0.12)",
        border: "1px solid rgba(109,40,217,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <Lock size={28} color="var(--pyth-bright)" />
        <div style={{
          position: "absolute", inset: -4,
          borderRadius: "50%",
          border: "1px solid rgba(109,40,217,0.15)",
          animation: "ring-pulse 2s ease-in-out infinite",
        }} />
      </div>

      <div>
        <h3 style={{ fontSize: "1.375rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Wallet Required to Play
        </h3>
        <p style={{ fontSize: "0.9375rem", color: "var(--t2)", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
          Connect your wallet to receive <strong style={{ color: "var(--pyth-bright)" }}>1,000 starting coins</strong> and begin your Oracle training.
        </p>
      </div>

      {/* Benefits row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: <Coins size={14} color="var(--pyth-bright)" />, label: "1,000 coins on connect" },
          { icon: <Zap size={14} color="var(--lime)" />, label: "Earn more by winning" },
          { icon: <span style={{ fontSize: "14px" }}>🔥</span>, label: "7-day streak multiplier" },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 0.875rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--r-full)",
            fontSize: "0.8125rem", color: "var(--t2)",
          }}>
            {icon} {label}
          </div>
        ))}
      </div>

      {/* Connect button */}
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={status === "connecting"}
        style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          padding: "0.875rem 2rem",
          background: "linear-gradient(135deg, var(--pyth), #8B5CF6)",
          border: "none", borderRadius: "var(--r-full)",
          color: "#fff", fontWeight: 800, fontSize: "0.9375rem",
          cursor: status === "connecting" ? "wait" : "pointer",
          boxShadow: "0 0 24px rgba(109,40,217,0.35)",
          opacity: status === "connecting" ? 0.7 : 1,
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseOver={(e) => {
          if (status !== "connecting") {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow = "0 0 36px rgba(109,40,217,0.55)";
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 24px rgba(109,40,217,0.35)";
        }}
      >
        <Wallet size={18} />
        {status === "connecting" ? "Connecting…" : "Connect Wallet to Play"}
      </button>

      <p style={{ fontSize: "0.75rem", color: "var(--t4)" }}>
        MetaMask or any injected wallet · Base Sepolia network
      </p>

      <style>{`
        @keyframes ring-pulse {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
