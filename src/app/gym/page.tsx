'use client';

import { ScenarioStudio } from "@/components/scenario-studio";
import { WalletGate } from "@/components/wallet-gate";
import { useWalletSession } from "@/components/wallet-connect-provider";

export default function GymPage() {
  const { isConnected, status } = useWalletSession();

  // Show loading while checking wallet status
  if (status === "connecting") {
    return (
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "var(--t3)", fontSize: "0.875rem" }}>Connecting wallet...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
        <WalletGate />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
      <ScenarioStudio />
    </div>
  );
}
