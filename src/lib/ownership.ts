import { createId } from "@/lib/utils";

export const OWNER_COOKIE_NAME = "pyth_oracle_gym_owner";
export const OWNER_HEADER_NAME = "x-pyth-oracle-gym-owner";
export const LEGACY_OWNER_ID = "__oracle_gym_legacy__";
export const DEFAULT_OWNER_BALANCE = 0;
export const DEFAULT_GYM_SEASON_ID = "season-1";

const WALLET_OWNER_PATTERN = /^wallet:([^:]+):(0x[a-f0-9]{40})$/i;

export function generateOwnerId() {
  return createId("owner");
}

export function normalizeOwnerId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 128) : null;
}

export function normalizeSeasonId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 64) : null;
}

export function normalizeWalletAddress(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(normalized) ? normalized : null;
}

export function getCurrentSeasonId() {
  return normalizeSeasonId(process.env.NEXT_PUBLIC_GYM_SEASON_ID) ?? DEFAULT_GYM_SEASON_ID;
}

export function buildWalletOwnerId(
  address: string | null | undefined,
  seasonId = getCurrentSeasonId(),
) {
  const walletAddress = normalizeWalletAddress(address);
  const normalizedSeasonId = normalizeSeasonId(seasonId) ?? DEFAULT_GYM_SEASON_ID;

  return walletAddress ? `wallet:${normalizedSeasonId}:${walletAddress}` : null;
}

export function parseOwnerId(value: string | null | undefined) {
  const raw = normalizeOwnerId(value);

  if (!raw) {
    return null;
  }

  const match = raw.match(WALLET_OWNER_PATTERN);

  if (!match) {
    return { kind: "guest" as const, raw };
  }

  return {
    kind: "wallet" as const,
    raw,
    seasonId: normalizeSeasonId(match[1]) ?? getCurrentSeasonId(),
    walletAddress: normalizeWalletAddress(match[2]),
  };
}

export function resolveOwnerIdForSeason(value: string | null | undefined) {
  const parsed = parseOwnerId(value);

  if (!parsed) {
    return null;
  }

  if (parsed.kind === "wallet" && parsed.walletAddress) {
    return buildWalletOwnerId(parsed.walletAddress);
  }

  return parsed.raw;
}
