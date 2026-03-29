"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WagmiProvider, useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains';
import { config } from '@/lib/wagmi-config';
import {
  buildWalletOwnerId,
  getCurrentSeasonId,
  normalizeWalletAddress,
} from "@/lib/ownership";
import { shortWalletAddress } from "@/lib/walletconnect";

type WalletSyncResponse = {
  ownerId?: string;
  changed?: boolean;
  walletAddress?: string | null;
  seasonId?: string;
  mode?: "wallet" | "guest";
};

type WalletSessionState = {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isReady: boolean;
  status: "idle" | "connecting" | "connected" | "unsupported";
  error: string | null;
  seasonId: string;
  shortAddress: string | null;
  walletLabel: string;
  isBaseSepolia: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToBaseSepolia: () => Promise<boolean>;
};

const WalletSessionContext = createContext<WalletSessionState | null>(null);

const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;

async function postIdentitySync(address: string | null) {
  const seasonId = getCurrentSeasonId();
  const response = await fetch("/api/identity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      seasonId,
    }),
  });

  if (!response.ok) {
    throw new Error("Identity sync failed");
  }

  return (await response.json()) as WalletSyncResponse;
}

// Create a client
const queryClient = new QueryClient();

function WalletSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  
  const [status, setStatus] = useState<WalletSessionState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSyncedOwnerIdRef = useRef<string | null>(null);
  const [walletLabel, setWalletLabel] = useState<string>("Wallet");

  const syncConnectedIdentity = useCallback(
    async (nextAddress: string) => {
      const normalizedAddress = normalizeWalletAddress(nextAddress);

      if (!normalizedAddress) {
        return;
      }

      const desiredOwnerId = buildWalletOwnerId(normalizedAddress, getCurrentSeasonId());
      const response = await postIdentitySync(normalizedAddress);
      const nextOwnerId = response.ownerId ?? desiredOwnerId;
      const changed = response.changed ?? nextOwnerId !== lastSyncedOwnerIdRef.current;

      if (nextOwnerId) {
        lastSyncedOwnerIdRef.current = nextOwnerId;
      }

      if (changed) {
        router.refresh();
      }
    },
    [router],
  );

  const switchToBaseSepolia = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: BASE_SEPOLIA_CHAIN_ID });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch to Base Sepolia");
      return false;
    }
  }, [switchChainAsync]);

  const connect = useCallback(async () => {
    // This will be called from the modal, not directly
    // The modal handles connector selection
    setStatus("connecting");
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      // Disconnect from wagmi
      await disconnectAsync();
      
      // Clear local state
      setStatus("idle");
      setError(null);
      lastSyncedOwnerIdRef.current = null;
      
      // Sync disconnection with backend
      await postIdentitySync(null);
      
      // Refresh to clear session
      router.refresh();
    } catch (err) {
      console.error("Disconnect error:", err);
      // Force clear state even if backend sync fails
      setStatus("idle");
      setError(null);
      lastSyncedOwnerIdRef.current = null;
      router.refresh();
    }
  }, [disconnectAsync, router]);

  // Sync when address changes
  useEffect(() => {
    if (address && isConnected) {
      setStatus("connected");
      void syncConnectedIdentity(address);
    } else if (!isConnected) {
      setStatus("idle");
    }
  }, [address, isConnected, syncConnectedIdentity]);

  // Update wallet label
  useEffect(() => {
    if (connector) {
      setWalletLabel(connector.name);
    }
  }, [connector]);

  // Set ready state
  useEffect(() => {
    setIsReady(true);
  }, []);

  const value = useMemo<WalletSessionState>(
    () => ({
      address: address || null,
      chainId: chainId || null,
      isConnected,
      isReady,
      status,
      error,
      seasonId: getCurrentSeasonId(),
      shortAddress: shortWalletAddress(address || null),
      walletLabel,
      isBaseSepolia: chainId === BASE_SEPOLIA_CHAIN_ID,
      connect,
      disconnect,
      switchToBaseSepolia,
    }),
    [address, chainId, isConnected, isReady, status, error, walletLabel, connect, disconnect, switchToBaseSepolia],
  );

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletSessionProvider>{children}</WalletSessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWalletSession() {
  const context = useContext(WalletSessionContext);

  if (!context) {
    throw new Error("useWalletSession must be used within WalletConnectProvider");
  }

  return context;
}
