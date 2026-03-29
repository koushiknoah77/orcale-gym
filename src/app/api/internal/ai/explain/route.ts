import { finalizeSession, getSession } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (!body.sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  const ownerId = await getRequestOwnerId();
  const session = getSession(ownerId, body.sessionId);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const scored = session.aiReport ? session : finalizeSession(ownerId, body.sessionId);
  return Response.json({ aiReport: scored?.aiReport, session: scored });
}
