import { getStatusSnapshot } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    deprecated: true,
    message:
      "The legacy truth-score endpoint has been replaced by the Oracle Gym API surface.",
    status: getStatusSnapshot(),
  });
}
