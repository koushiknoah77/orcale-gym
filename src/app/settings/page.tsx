import { getStatusSnapshot } from "@/lib/pyth";
import { getStoreFilePath } from "@/lib/oracle-store";
import { WALLET_CONNECT_PROJECT_ID, WALLET_CONNECT_NETWORK, getCurrentSeasonId } from "@/lib/walletconnect";
import { CheckCircle2, Circle, Server, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const status = getStatusSnapshot();

  const rows = [
    { label: "Pyth history endpoint", value: status.historyEndpoint, detail: "Used for symbols and candlestick replay data.", ready: status.pythHistoryConfigured },
    { label: "Hermes live endpoint", value: status.hermesEndpoint, detail: "Used for live latest-price snapshots.", ready: status.hermesLiveConfigured },
    { label: "Live mode", value: status.liveModeEnabled ? "Enabled" : "Disabled", detail: "Live readouts use Hermes while replay uses historical windows.", ready: status.liveModeEnabled },
    { label: "Entropy V2 consumer", value: status.entropyConsumerAddress, detail: `Boss fight shocks route through ${status.entropyChainName}.`, ready: status.entropyEnabled },
    { label: "Entropy callback gas", value: status.entropyCallbackGasLimit.toLocaleString(), detail: "Gas limit for Entropy V2 callback.", ready: status.entropyEnabled },
    { label: "Fallback behavior", value: status.fallbackMode, detail: "Synthetic replay is a last-resort fallback.", ready: true },
    { label: "Session storage", value: getStoreFilePath(), detail: "Persists sessions, scores, history across restarts.", ready: true },
    { label: "WalletConnect project ID", value: WALLET_CONNECT_PROJECT_ID ? "Configured" : "Optional", detail: "Only needed for WalletConnect modal upgrade.", ready: true },
    { label: "WalletConnect network", value: WALLET_CONNECT_NETWORK.name, detail: "Base Sepolia for live Entropy.", ready: true },
    { label: "Current season", value: getCurrentSeasonId(), detail: "Bump NEXT_PUBLIC_GYM_SEASON_ID for a fresh bucket.", ready: true },
    { label: "Pyth Pro token", value: status.pythProTokenConfigured ? "Configured" : "Optional", detail: "For MCP-protected latest-price calls.", ready: true },
  ];

  const envVars = [
    { name: "PYTH_HISTORY_BASE_URL", desc: "Defaults to public Pyth history. Override if proxied." },
    { name: "PYTH_HERMES_BASE_URL", desc: "Public Hermes for live price snapshots." },
    { name: "PYTH_PRO_ACCESS_TOKEN", desc: "Optional for MCP-based protected flows." },
    { name: "ORACLE_GYM_STORE_PATH", desc: "Overrides default JSON store path." },
    { name: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", desc: "For WalletConnect modal upgrade." },
    { name: "NEXT_PUBLIC_GYM_SEASON_ID", desc: "Bump for a fresh reset bucket." },
    { name: "ENTROPY_RPC_URL", desc: "Required for live Entropy V2 requests." },
    { name: "ENTROPY_CONSUMER_ADDRESS", desc: "Deployed Entropy consumer contract address." },
    { name: "ENTROPY_REQUESTER_PRIVATE_KEY", desc: "Server wallet for Entropy V2 requests." },
    { name: "ENTROPY_CHAIN_ID / CHAIN_NAME / CALLBACK_GAS", desc: "Optional chain metadata and gas tuning." },
  ];

  return (
    <div className="grid-sidebar" style={{ gap: "2rem", maxWidth: "1300px", margin: "0 auto" }}>
      <section className="game-panel" style={{ padding: "2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ color: "var(--pyth-bright)", marginBottom: "0.5rem" }}>⚙️ Arena Settings</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3 }}>Connector health, fallback rules, and deploy-time config.</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {rows.map((row) => (
            <div key={row.label} className="glass-pill" style={{ padding: "1.25rem", border: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    {row.ready ? <CheckCircle2 size={14} color="var(--lime)" /> : <Circle size={14} color="var(--t4)" />}
                    <p style={{ fontWeight: 800, fontSize: "0.9375rem" }}>{row.label}</p>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--t3)", lineHeight: 1.5 }}>{row.detail}</p>
                </div>
                <span className="metric" style={{ padding: "0.3rem 0.875rem", borderRadius: "var(--r-full)", background: row.ready ? "var(--lime-dim)" : "rgba(255,255,255,0.04)", border: row.ready ? "1px solid rgba(170, 255, 0, 0.15)" : "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: row.ready ? "var(--lime)" : "var(--t3)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <section className="game-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Terminal size={16} color="var(--pyth-bright)" />
            <p className="eyebrow" style={{ color: "var(--pyth-bright)" }}>🔧 Env Vars</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {envVars.map((v) => (
              <div key={v.name} style={{ padding: "1rem 1.25rem", borderRadius: "var(--r-lg)", border: "1px solid var(--border-default)", background: "rgba(10, 10, 27, 0.6)" }}>
                <p className="metric" style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--pyth-bright)", marginBottom: "0.5rem", wordBreak: "break-all" }}>{v.name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--t3)", lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="game-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Server size={16} color="var(--lime)" />
            <p className="eyebrow" style={{ color: "var(--lime)" }}>🚀 Hackathon Readiness</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", fontSize: "0.875rem", lineHeight: 1.7, color: "var(--t2)" }}>
            {["Deploy the Next app to Vercel, keep the repo public with Apache 2.0 license.", "Exposes real symbol discovery, historical replay, Hermes live-price, and Entropy V2 shock.", "Add a short demo video, screenshots, and a public post to complete submission."].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem" }}>
                <CheckCircle2 size={16} color="var(--lime)" style={{ flexShrink: 0, marginTop: "0.25rem" }} />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
