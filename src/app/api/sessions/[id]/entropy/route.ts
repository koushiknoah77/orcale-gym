import { armSessionEntropy, getSession, syncSessionEntropy } from "@/lib/oracle-store";
import { getRequestOwnerId } from "@/lib/request-owner";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ownerId = await getRequestOwnerId();
  const existing = getSession(ownerId, id);

  if (!existing) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const session =
    existing.entropy?.status === "idle" || existing.entropy?.status === "tx-failed"
      ? await armSessionEntropy(ownerId, id)
      : await syncSessionEntropy(ownerId, id);

  return Response.json({ session: session ?? existing });
}
