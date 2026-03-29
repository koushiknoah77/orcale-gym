import { markOwnerSeen } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";
import { parseOwnerId } from "@/lib/ownership";
import { cookies } from "next/headers";
import { OWNER_COOKIE_NAME } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export async function POST() {
  const ownerId = await getRequestOwnerId();
  const cookieStore = await cookies();
  const ownerCookie = cookieStore.get(OWNER_COOKIE_NAME)?.value;
  const parsed = parseOwnerId(ownerCookie);
  const isWalletOwner = parsed?.kind === "wallet";
  
  markOwnerSeen(ownerId, isWalletOwner);
  return Response.json({ ok: true });
}
