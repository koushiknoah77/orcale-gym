import { getHistoryEntries, getLeaderboardEntries } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getRequestOwnerId();
  const history = getHistoryEntries(ownerId);
  const leaderboard = getLeaderboardEntries(ownerId);
  
  return Response.json({ history, leaderboard });
}
