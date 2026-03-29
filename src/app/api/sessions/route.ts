import { buildScenario } from "@/lib/oracle-engine";
import {
  armSessionEntropy,
  createSession,
  getScenario,
  getUserBalance,
  saveScenario,
} from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";
import { parseScenarioInput } from "@/lib/request-parsers";
import type { Scenario } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    scenarioId?: string;
  };
  const ownerId = await getRequestOwnerId();

  // Check if user has sufficient balance (100 coins required)
  const currentBalance = getUserBalance(ownerId);
  if (currentBalance < 100) {
    return Response.json(
      { error: "Insufficient balance. You need 100 coins to start a game." },
      { status: 400 }
    );
  }

  let scenario: Scenario | null =
    typeof payload.scenarioId === "string" ? getScenario(ownerId, payload.scenarioId) : null;

  if (!scenario) {
    scenario = await buildScenario(parseScenarioInput(payload));
    saveScenario(ownerId, scenario);
  }

  const session = createSession(ownerId, scenario);
  const entropyReadySession = await armSessionEntropy(ownerId, session.id);

  return Response.json({ sessionId: session.id, session: entropyReadySession ?? session });
}
