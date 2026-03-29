"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { baseSepolia } from "viem/chains";
import {
  buildWalletOwnerId,
  getCurrentSeasonId,
  normalizeWalletAddress,
} from "@/lib/ownership";
import { shortWalletAddress } from "@/lib/walletconnect";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: EthereumProvider[];
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

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
const BASE_SEPOLIA_CHAIN_HEX = `0x${baseSepolia.id.toString(16)}`;

function parseChainId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      return Number.parseInt(value, 16);
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.ethereum ?? null;
}

function getInjectedWalletProvider(): EthereumProvider | null {
  const ethereum = getEthereum();

  if (!ethereum) {
    return null;
  }

  const providers = Array.isArray(ethereum.providers) ? ethereum.providers : [];

  if (providers.length === 0) {
    return ethereum;
  }

  return (
    providers.find((provider) => provider.isMetaMask) ??
    providers.find((provider) => provider.isCoinbaseWallet) ??
    providers[0] ??
    ethereum
  );
}

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

function getProviderLabel(provider: EthereumProvider | null) {
  if (!provider) {
    return "Injected wallet";
  }

  if (provider.isMetaMask) {
    return "MetaMask";
  }

  if (provider.isCoinbaseWallet) {
    return "Coinbase Wallet";
  }

  return "Injected wallet";
}

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState<WalletSessionState["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSyncedOwnerIdRef = useRef<string | null>(null);
  const [walletLabel, setWalletLabel] = useState<string>("Injected wallet");

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
    const ethereum = getInjectedWalletProvider();

    if (!ethereum) {
      setError("No injected wallet found.");
      return false;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_HEX }],
      });
      setChainId(BASE_SEPOLIA_CHAIN_ID);
      return true;
    } catch (switchError) {
      const code = typeof switchError === "object" && switchError !== null ? (switchError as { code?: number }).code : null;

      if (code !== 4902) {
        setError(switchError instanceof Error ? switchError.message : "Failed to switch to Base Sepolia.");
        return false;
      }

      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_SEPOLIA_CHAIN_HEX,
            chainName: baseSepolia.name,
            nativeCurrency: baseSepolia.nativeCurrency,
            rpcUrls: baseSepolia.rpcUrls.default.http,
            blockExplorerUrls: [baseSepolia.blockExplorers?.default.url ?? "https://sepolia-explorer.base.org"],
          },
        ],
      });
      setChainId(BASE_SEPOLIA_CHAIN_ID);
      return true;
    }
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getInjectedWalletProvider();

    if (!ethereum) {
      setError("Install MetaMask or another injected wallet first.");
      setStatus("unsupported");
      return;
    }

    setStatus("connecting");
    setError(null);
    setWalletLabel(getProviderLabel(ethereum));

    try {
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const nextAddress = accounts[0] ?? null;
      const chainHex = await ethereum.request({ method: "eth_chainId" });
      const nextChainId = parseChainId(chainHex);
      let resolvedChainId = nextChainId ?? BASE_SEPOLIA_CHAIN_ID;

      if (nextChainId && nextChainId !== BASE_SEPOLIA_CHAIN_ID) {
        const switched = await switchToBaseSepolia();
        if (!switched) {
          setStatus("idle");
          return;
        }
        resolvedChainId = BASE_SEPOLIA_CHAIN_ID;
      }

      if (nextAddress) {
        setAddress(nextAddress);
        setChainId(resolvedChainId);
        setStatus("connected");
        await syncConnectedIdentity(nextAddress);
      }
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Wallet connection failed.");
      setStatus("idle");
    }
  }, [switchToBaseSepolia, syncConnectedIdentity]);

  const disconnect = useCallback(async () => {
    // Clear local state
    setAddress(null);
    setChainId(null);
    setError(null);
    setStatus("idle");
    
    // Clear the last synced owner ID
    lastSyncedOwnerIdRef.current = null;
    
    // Sync disconnection with backend (set address to null)
    try {
      await postIdentitySync(null);
      // Refresh the page to clear all session data
      router.refresh();
    } catch (err) {
      console.error("Failed to sync disconnect:", err);
    }
  }, [router]);

  useEffect(() => {
    const ethereum = getInjectedWalletProvider();

    async function bootstrap() {
      if (!ethereum) {
        setIsReady(true);
        setStatus("unsupported");
        return;
      }

      try {
        const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
        const chainHex = await ethereum.request({ method: "eth_chainId" });
        const nextChainId = parseChainId(chainHex);

        setChainId(nextChainId);
        setWalletLabel(getProviderLabel(ethereum));

        if (accounts[0]) {
          const nextAddress = accounts[0];
          setAddress(nextAddress);
          setStatus("connected");
          await syncConnectedIdentity(nextAddress);
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      } finally {
        setIsReady(true);
      }
    }

    void bootstrap();
  }, [syncConnectedIdentity]);

  useEffect(() => {
    const ethereum = getInjectedWalletProvider();
    if (!ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] : [];
      const nextAddress = typeof accounts[0] === "string" ? accounts[0] : null;

      setAddress(nextAddress);

      if (nextAddress) {
        setStatus("connected");
        void syncConnectedIdentity(nextAddress);
      } else {
        setStatus("idle");
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      setChainId(parseChainId(args[0]));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [syncConnectedIdentity]);

  const value = useMemo<WalletSessionState>(
    () => ({
      address,
      chainId,
      isConnected: Boolean(address),
      isReady,
      status,
      error,
      seasonId: getCurrentSeasonId(),
      shortAddress: shortWalletAddress(address),
      walletLabel,
      isBaseSepolia: chainId === BASE_SEPOLIA_CHAIN_ID,
      connect,
      disconnect,
      switchToBaseSepolia,
    }),
    [address, chainId, connect, disconnect, error, isReady, status, switchToBaseSepolia, walletLabel],
  );

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function useWalletSession() {
  const context = useContext(WalletSessionContext);

  if (!context) {
    throw new Error("useWalletSession must be used within WalletConnectProvider");
  }

  return context;
}
