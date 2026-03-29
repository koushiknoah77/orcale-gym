import { getLeaderboardEntries } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getRequestOwnerId();
  return Response.json({ leaderboard: getLeaderboardEntries(ownerId) });
}
