import { buildScenario } from "@/lib/oracle-engine";
import { saveScenario } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";
import { parseScenarioInput } from "@/lib/request-parsers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const scenario = await buildScenario(parseScenarioInput(payload));
  const ownerId = await getRequestOwnerId();
  saveScenario(ownerId, scenario);

  return Response.json({ scenario });
}
