import { getUserStats } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getRequestOwnerId();
  const stats = getUserStats(ownerId);
  return Response.json(stats);
}
