import { fetchPythSymbols } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "BTC";
  const symbols = await fetchPythSymbols(query);

  return Response.json({ symbols });
}
