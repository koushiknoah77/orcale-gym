import { fetchLatestPriceSnapshots } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    assetKeys?: string[];
  };

  try {
    const prices = await fetchLatestPriceSnapshots(body.assetKeys);
    return Response.json({ prices });
  } catch {
    return Response.json(
      { error: "Failed to fetch latest Pyth prices from Hermes" },
      { status: 502 },
    );
  }
}
