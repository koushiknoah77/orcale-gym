import { getStatusSnapshot } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: getStatusSnapshot() });
}
