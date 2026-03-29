"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Flame, Gamepad2, LogOut, Settings, Trophy, Zap } from "lucide-react";
import { useWalletSession } from "@/components/wallet-connect-provider";
import { LiveTickerBar } from "@/components/live-ticker-bar";
import { StreakShop } from "@/components/streak-shop";
import { WalletSelectorModal } from "@/components/wallet-selector-modal";
import { useEffect, useState, useRef } from "react";
import type { UserStats } from "@/lib/types";

const tabs = [
  { href: "/", label: "Arena", icon: Gamepad2 },
  { href: "/gym", label: "Train", icon: Zap },
  { href: "/history", label: "Rankings", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

const XP_PER_LEVEL = 500;

function xpPctInLevel(xp: number): number {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

export function OracleNav() {
  const pathname = usePathname();
  const { disconnect, error, isBaseSepolia, isConnected, isReady, shortAddress, status, switchToBaseSepolia } = useWalletSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [levelUp, setLevelUp] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showStreakShop, setShowStreakShop] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  // Fetch live user stats every 8 seconds
  useEffect(() => {
    let ignore = false;
    async function fetchStats() {
      try {
        const res = await fetch("/api/user-stats");
        if (!res.ok) return;
        const data = (await res.json()) as UserStats;
        if (!ignore) {
          setStats((prev) => {
            if (prev && data.level > prev.level) setLevelUp(true);
            return data;
          });
        }
      } catch { /* silent */ }
    }
    void fetchStats();
    const id = window.setInterval(() => void fetchStats(), 8000);
    return () => { ignore = true; window.clearInterval(id); };
  }, []);

  // Hide level-up banner after 3s
  useEffect(() => {
    if (!levelUp) return;
    const t = window.setTimeout(() => setLevelUp(false), 3000);
    return () => window.clearTimeout(t);
  }, [levelUp]);

  // Close wallet menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleWallet() {
    if (!isReady || status === "connecting") return;
    if (status === "unsupported") { window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer"); return; }
    if (!isConnected) { 
      setShowWalletSelector(true);
      return;
    }
    if (!isBaseSepolia) await switchToBaseSepolia();
  }

  async function handleDisconnect() {
    setShowWalletMenu(false);
    await disconnect();
  }

  const walletLabel = !isConnected
    ? status === "connecting" ? "Connecting…" : "Connect"
    : isBaseSepolia ? (shortAddress ?? "Connected") : "Switch Net";
  const disabled = status === "connecting";
  const dotColor = !isConnected ? "var(--t4)" : isBaseSepolia ? "var(--lime)" : "var(--amber)";

  const xpPct  = stats ? xpPctInLevel(stats.xp) : 0;
  const level  = stats?.level ?? 1;
  const streak = stats?.streak ?? 0;
  const balance = stats?.balance ?? null;

  return (
    <>
      {showWalletSelector && (
        <WalletSelectorModal onClose={() => setShowWalletSelector(false)} />
      )}
      
      {showStreakShop && balance !== null && (
        <StreakShop balance={balance} currentStreak={streak} onClose={() => setShowStreakShop(false)} />
      )}
      
      {/* Level-up banner */}
      {levelUp && (
        <div style={{
          position: "fixed", top: "5rem", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "0.75rem 2rem",
          background: "linear-gradient(135deg, var(--pyth), var(--lime))",
          borderRadius: "var(--r-full)", color: "#0A0A1B", fontWeight: 800,
          fontSize: "0.9375rem", boxShadow: "0 0 30px var(--pyth-glow)",
          animation: "slide-up 0.4s ease-out",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          ⬆️ LEVEL UP! You are now Level {level}!
        </div>
      )}

      <nav className="top-nav">
        <div className="top-nav-inner">
          {/* Logo + Streak */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", zIndex: 2 }}>
            <Link href="/" className="nav-logo">
              <div className="nav-logo-mark">
                <Zap size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="nav-logo-text">Oracle Gym</span>
            </Link>

            {/* Streak - moved to left side */}
            {isConnected && isBaseSepolia && (
              <button
                onClick={() => setShowStreakShop(true)}
                title={streak > 0 ? `${streak} day streak! ×${stats?.streakMultiplier || 2} coin multiplier. Click to boost.` : "Click to purchase streak boost"}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "var(--r-full)",
                  background: streak > 0 ? "rgba(255, 187, 0, 0.1)" : "rgba(255, 187, 0, 0.05)",
                  border: `1px solid ${streak > 0 ? "rgba(255, 187, 0, 0.25)" : "rgba(255, 187, 0, 0.1)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 187, 0, 0.18)";
                  e.currentTarget.style.borderColor = "rgba(255, 187, 0, 0.35)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = streak > 0 ? "rgba(255, 187, 0, 0.1)" : "rgba(255, 187, 0, 0.05)";
                  e.currentTarget.style.borderColor = streak > 0 ? "rgba(255, 187, 0, 0.25)" : "rgba(255, 187, 0, 0.1)";
                }}
              >
                <Flame size={14} color="var(--amber)" />
                <span style={{ color: "var(--amber)", fontWeight: 700, fontSize: "0.875rem" }}>{streak > 0 ? streak : "0"}</span>
                {streak > 0 && stats && (
                  <span style={{ color: "var(--amber)", fontSize: "0.75rem", fontWeight: 800 }}>×{stats.streakMultiplier}</span>
                )}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="nav-tabs">
            {tabs.map((tab) => {
              const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href} className={`nav-tab${active ? " active" : ""}`}>
                  <Icon size={15} />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: Coins + XP + Wallet */}
          <div className="nav-right">
            {/* Coins - only show when wallet is connected */}
            {balance !== null && isConnected && isBaseSepolia && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "var(--r-full)",
                background: "rgba(109, 40, 217, 0.1)",
                border: "1px solid rgba(109, 40, 217, 0.25)",
              }}>
                <Coins size={14} color="var(--pyth-bright)" />
                <span style={{ color: "var(--pyth-bright)", fontWeight: 700, fontSize: "0.875rem" }}>{balance.toLocaleString()}</span>
              </div>
            )}

            {/* XP Bar */}
            <div className="xp-bar-wrap">
              <div className="level-badge">{level}</div>
              <div className="xp-bar-track">
                <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="xp-label">{Math.round(xpPct)}%</span>
            </div>

            {/* Wallet */}
            <div style={{ position: "relative" }} ref={walletMenuRef}>
              <button
                type="button"
                onClick={() => {
                  if (isConnected && isBaseSepolia) {
                    setShowWalletMenu(!showWalletMenu);
                  } else {
                    void handleWallet();
                  }
                }}
                disabled={disabled}
                className="btn btn-primary btn-sm"
                style={{ opacity: disabled ? 0.6 : 1, fontSize: "0.75rem", padding: "0.4rem 0.875rem" }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0 }} />
                {walletLabel}
              </button>

              {/* Wallet dropdown menu */}
              {showWalletMenu && isConnected && isBaseSepolia && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 0.5rem)",
                  right: 0,
                  minWidth: "200px",
                  background: "var(--surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  zIndex: 1000,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)" }}>
                    <p style={{ fontSize: "0.6875rem", color: "var(--t3)", marginBottom: "0.25rem" }}>Connected</p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{shortAddress}</p>
                  </div>
                  
                  {stats && (
                    <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                        <span style={{ color: "var(--t3)" }}>Balance</span>
                        <span style={{ fontWeight: 800, color: "var(--pyth-bright)" }}>{stats.balance} coins</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                        <span style={{ color: "var(--t3)" }}>Level</span>
                        <span style={{ fontWeight: 800 }}>{stats.level}</span>
                      </div>
                      {stats.streak > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                          <span style={{ color: "var(--t3)" }}>Streak</span>
                          <span style={{ fontWeight: 800, color: "var(--amber)" }}>🔥 {stats.streak} days</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      color: "var(--coral)",
                      cursor: "pointer",
                      transition: "background 150ms ease",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 77, 106, 0.08)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "none"}
                  >
                    <LogOut size={14} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            maxWidth: "1400px", margin: "0 auto", padding: "0.5rem 2rem",
            fontSize: "0.8125rem", color: "var(--coral)",
            background: "var(--coral-dim)",
            borderTop: "1px solid rgba(255, 77, 106, 0.2)",
          }}>
            ⚠️ {error}
          </div>
        )}
      </nav>
      <LiveTickerBar />
    </>
  );
}
