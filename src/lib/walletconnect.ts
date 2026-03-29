import { baseSepolia } from "viem/chains";
import {
  buildWalletOwnerId,
  getCurrentSeasonId as getOwnerSeasonId,
  normalizeWalletAddress,
} from "@/lib/ownership";

export { getOwnerSeasonId as getCurrentSeasonId };

export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";
export const WALLET_CONNECT_NETWORK = baseSepolia;
export const WALLET_CONNECT_NETWORKS = [baseSepolia] as const;

export function getWalletConnectMetadata() {
  return {
    name: "Pyth Oracle Gym",
    description:
      "Wallet-connected market replay and Entropy training for the Pyth Oracle Gym.",
    url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    icons: ["/favicon.ico"],
  };
}

export function getWalletSeasonOwnerId(
  address: string | null | undefined,
  seasonId = getOwnerSeasonId(),
) {
  return buildWalletOwnerId(address, seasonId);
}

export function shortWalletAddress(address: string | null | undefined) {
  const normalized = normalizeWalletAddress(address);

  if (!normalized) {
    return null;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}
