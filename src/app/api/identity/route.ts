import { NextRequest, NextResponse } from "next/server";
import {
  OWNER_COOKIE_NAME,
  buildWalletOwnerId,
  generateOwnerId,
  getCurrentSeasonId,
  normalizeOwnerId,
  normalizeSeasonId,
  parseOwnerId,
  normalizeWalletAddress,
} from "@/lib/ownership";

export const dynamic = "force-dynamic";

type IdentityPayload = {
  address?: string | null;
  seasonId?: string;
  status?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as IdentityPayload;
  const seasonId = normalizeSeasonId(payload.seasonId) ?? getCurrentSeasonId();
  const normalizedAddress =
    typeof payload.address === "string" ? normalizeWalletAddress(payload.address) : null;
  const currentOwnerId = normalizeOwnerId(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  const currentParsedOwner = parseOwnerId(request.cookies.get(OWNER_COOKIE_NAME)?.value);

  if (typeof payload.address === "string" && payload.address.trim().length > 0 && !normalizedAddress) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const ownerId = normalizedAddress
    ? buildWalletOwnerId(normalizedAddress, seasonId) ?? currentOwnerId ?? generateOwnerId()
    : currentOwnerId ?? generateOwnerId();
  const changed = ownerId !== currentOwnerId;
  const walletAddress =
    normalizedAddress ?? (currentParsedOwner?.kind === "wallet" ? currentParsedOwner.walletAddress : null);
  const mode = (normalizedAddress || currentParsedOwner?.kind === "wallet") ? "wallet" : "guest";

  const response = NextResponse.json({
    ownerId,
    seasonId,
    walletAddress,
    mode,
    changed,
    status: payload.status ?? null,
  });

  response.cookies.set({
    name: OWNER_COOKIE_NAME,
    value: ownerId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
