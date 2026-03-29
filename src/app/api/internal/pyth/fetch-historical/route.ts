import { fetchPythCandlesWithMeta, resolveAssetOption } from "@/lib/pyth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    assetKey?: string;
    from?: number;
    to?: number;
    resolution?: string;
  };

  const asset = await resolveAssetOption(body.assetKey ?? "BTC");
  const from =
    typeof body.from === "number" ? body.from : Math.floor(Date.now() / 1000) - 12 * 60 * 60;
  const to = typeof body.to === "number" ? body.to : Math.floor(Date.now() / 1000);
  const resolution = typeof body.resolution === "string" ? body.resolution : "15";

  try {
    const result = await fetchPythCandlesWithMeta({
      asset,
      from,
      to,
      resolution,
    });

    return Response.json({
      asset,
      channel: result.channel,
      symbol: result.symbol,
      candles: result.candles,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch historical data from Pyth history service" },
      { status: 502 },
    );
  }
}
