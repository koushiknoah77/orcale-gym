"use client";

import { useParams } from "next/navigation";
import { ReplayLab } from "@/components/replay-lab";
import { WalletGate } from "@/components/wallet-gate";
import { useWalletSession } from "@/components/wallet-connect-provider";

export default function ReplayPage() {
  const { isConnected, status } = useWalletSession();
  const params = useParams<{ sessionId: string }>();

  // Show loading while checking wallet status
  if (status === "connecting") {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "var(--t3)" }}>Loading...</p>
      </div>
    );
  }

  // Require wallet connection to play
  if (!isConnected) {
    return (
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
        <WalletGate />
      </div>
    );
  }

  return <ReplayLab sessionId={params.sessionId} />;
}
