import { getSession, getUserBalance, recordDecision } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";
import { parseDecisionInput } from "@/lib/request-parsers";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ownerId = await getRequestOwnerId();
  const existing = getSession(ownerId, id);

  if (!existing) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const payload = parseDecisionInput(await request.json().catch(() => ({})));
  const session = recordDecision({
    ownerId,
    sessionId: id,
    checkpointId: payload.checkpointId,
    action: payload.action,
    confidence: payload.confidence,
    reason: payload.reason,
    timerRemaining: payload.timerRemaining,
    actor: payload.actor,
  });

  return Response.json({ session, userBalance: getUserBalance(ownerId) });
}
