import { finalizeSession, getSession } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ownerId = await getRequestOwnerId();
  const session = getSession(ownerId, id);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const scored = finalizeSession(ownerId, id);
  return Response.json({ session: scored });
}
