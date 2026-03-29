import { fetchLatestPriceSnapshots } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetKeys = searchParams
    .get("assetKeys")
    ?.split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  try {
    const prices = await fetchLatestPriceSnapshots(assetKeys);
    return Response.json({ prices });
  } catch {
    return Response.json(
      { error: "Failed to fetch live Pyth prices from Hermes" },
      { status: 502 },
    );
  }
}
