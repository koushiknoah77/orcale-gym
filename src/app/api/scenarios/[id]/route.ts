import { getScenario } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ownerId = await getRequestOwnerId();
  const scenario = getScenario(ownerId, id);

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  return Response.json({ scenario });
}
