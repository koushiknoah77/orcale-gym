import { ASSET_OPTIONS } from "@/lib/constants";
import { getEntropyRuntimeSnapshot } from "@/lib/entropy";
import type { AssetOption, Candle, LivePriceSnapshot, StatusSnapshot } from "@/lib/types";

type HistoryResponse = {
  s?: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
};

type SymbolRecord = {
  pyth_lazer_id?: number;
  name?: string;
  symbol?: string;
  description?: string;
  asset_type?: string;
  exponent?: number;
  min_channel?: string;
  state?: string;
  hermes_id?: string;
  quote_currency?: string;
};

type HermesLatestResponse = {
  parsed?: Array<{
    id?: string;
    price?: {
      price?: string;
      conf?: string;
      expo?: number;
      publish_time?: number;
    };
  }>;
};

export type PythCandlesResult = {
  candles: Candle[];
  channel: string;
  symbol: string;
};

function resolveHistoryBaseUrl() {
  const raw = process.env.PYTH_HISTORY_BASE_URL?.trim();

  if (!raw) {
    return "https://history.pyth-lazer.dourolabs.app/v1";
  }

  return raw.endsWith("/v1") ? raw : `${raw.replace(/\/$/, "")}/v1`;
}

function resolveHermesBaseUrl() {
  const raw = process.env.PYTH_HERMES_BASE_URL?.trim();

  if (!raw) {
    return "https://hermes.pyth.network";
  }

  return raw.replace(/\/$/, "");
}

function symbolParts(fullSymbol: string) {
  const market = fullSymbol.includes(".") ? fullSymbol.split(".")[1] ?? fullSymbol : fullSymbol;
  const [base, quote = "USD"] = market.split("/");

  return {
    base: base.toUpperCase(),
    quote: quote.toUpperCase(),
    market,
  };
}

function labelFromSymbol(fullSymbol: string) {
  const { base, quote } = symbolParts(fullSymbol);
  return `${base} / ${quote}`;
}

function normalizeAssetOption(record: SymbolRecord): AssetOption | null {
  if (!record.symbol || record.asset_type !== "crypto") {
    return null;
  }

  const existing = ASSET_OPTIONS.find(
    (asset) =>
      asset.fullSymbol === record.symbol ||
      asset.historySymbol === record.symbol ||
      asset.hermesId === record.hermes_id,
  );
  const { base } = symbolParts(record.symbol);

  return {
    key: existing?.key ?? base,
    label: existing?.label ?? labelFromSymbol(record.symbol),
    fullSymbol: record.symbol,
    historySymbol: record.symbol,
    assetType: "crypto",
    basePrice: existing?.basePrice ?? 100,
    channel: record.min_channel ?? existing?.channel ?? "real_time",
    resolution: existing?.resolution ?? "15",
    hermesId: record.hermes_id ?? existing?.hermesId,
    pythLazerId: record.pyth_lazer_id ?? existing?.pythLazerId,
    description: record.description ?? existing?.description,
    exponent: record.exponent ?? existing?.exponent,
    state: record.state ?? existing?.state,
    quoteCurrency: record.quote_currency ?? existing?.quoteCurrency,
  };
}

function mergeAssets(assets: AssetOption[]) {
  const merged = new Map<string, AssetOption>();

  for (const asset of [...ASSET_OPTIONS, ...assets]) {
    const current = merged.get(asset.key);
    merged.set(asset.key, {
      ...current,
      ...asset,
      key: asset.key,
    });
  }

  return [...merged.values()];
}

function findMatchingAsset(assets: AssetOption[], assetKey: string) {
  const normalized = assetKey.trim().toUpperCase();

  return (
    assets.find((asset) => asset.key === normalized) ??
    assets.find((asset) => asset.fullSymbol.toUpperCase().includes(`${normalized}/`)) ??
    assets.find((asset) => asset.label.toUpperCase().startsWith(`${normalized} /`)) ??
    null
  );
}

function dedupeStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function mapHistoryResponse(json: HistoryResponse) {
  if (json.s !== "ok" || !json.t || !json.o || !json.h || !json.l || !json.c) {
    return [];
  }

  return json.t.map((time, index) => ({
    time: time * 1000,
    open: json.o?.[index] ?? json.c?.[index] ?? 0,
    high: json.h?.[index] ?? json.c?.[index] ?? 0,
    low: json.l?.[index] ?? json.c?.[index] ?? 0,
    close: json.c?.[index] ?? 0,
    volume: json.v?.[index] ?? 0,
  }));
}

function scaledIntegerToNumber(value: string | undefined, exponent: number) {
  if (!value) {
    return 0;
  }

  return Number(value) * 10 ** exponent;
}

export function getStatusSnapshot(): StatusSnapshot {
  const historyEndpoint = resolveHistoryBaseUrl();
  const hermesEndpoint = resolveHermesBaseUrl();
  const pythProToken = process.env.PYTH_PRO_ACCESS_TOKEN?.trim();
  const pythProTokenConfigured =
    Boolean(pythProToken) && pythProToken !== "replace_with_your_token_if_needed";
  const hermesLiveConfigured = hermesEndpoint.length > 0;
  const entropy = getEntropyRuntimeSnapshot();

  return {
    historyEndpoint,
    hermesEndpoint,
    pythHistoryConfigured: historyEndpoint.length > 0,
    pythProTokenConfigured,
    hermesLiveConfigured,
    liveModeEnabled: hermesLiveConfigured,
    entropyEnabled: entropy.enabled,
    entropyChainName: entropy.chainName,
    entropyConsumerAddress: entropy.consumerAddress,
    entropyExplorerUrl: entropy.explorerUrl,
    entropyCallbackGasLimit: entropy.callbackGasLimit,
    fallbackMode:
      "Real Pyth history and Hermes live prices first, synthetic replay only on fetch failure or when Entropy is unavailable",
  };
}

export async function fetchPythSymbols(query = "BTC"): Promise<AssetOption[]> {
  const params = new URLSearchParams({
    asset_type: "crypto",
    query,
  });

  // Prepare headers with Pyth Pro token if available
  const headers: HeadersInit = {};
  const pythProToken = process.env.PYTH_PRO_ACCESS_TOKEN?.trim();
  if (pythProToken && pythProToken !== "replace_with_your_token_if_needed") {
    headers["Authorization"] = `Bearer ${pythProToken}`;
  }

  try {
    const response = await fetch(`${resolveHistoryBaseUrl()}/symbols?${params.toString()}`, {
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch symbol list");
    }

    const json = (await response.json()) as SymbolRecord[];
    const mapped = json
      .map(normalizeAssetOption)
      .filter((record): record is AssetOption => record !== null)
      .slice(0, 12);

    return mergeAssets(mapped);
  } catch {
    return ASSET_OPTIONS;
  }
}

export async function resolveAssetOption(assetKey: string): Promise<AssetOption> {
  const known = findMatchingAsset(ASSET_OPTIONS, assetKey);
  if (known) {
    return known;
  }

  const symbols = await fetchPythSymbols(assetKey);
  return findMatchingAsset(symbols, assetKey) ?? ASSET_OPTIONS[0];
}

export async function fetchPythCandlesWithMeta(options: {
  asset: AssetOption;
  from: number;
  to: number;
  resolution: string;
  channel?: string;
}): Promise<PythCandlesResult> {
  const base = resolveHistoryBaseUrl();
  const channels = dedupeStrings([
    options.channel,
    options.asset.channel,
    "fixed_rate@200ms",
    "real_time",
  ]);
  const symbols = dedupeStrings([options.asset.fullSymbol, options.asset.historySymbol]);

  // Prepare headers with Pyth Pro token if available
  const headers: HeadersInit = {};
  const pythProToken = process.env.PYTH_PRO_ACCESS_TOKEN?.trim();
  if (pythProToken && pythProToken !== "replace_with_your_token_if_needed") {
    headers["Authorization"] = `Bearer ${pythProToken}`;
  }

  for (const channel of channels) {
    for (const symbol of symbols) {
      const params = new URLSearchParams({
        symbol,
        from: String(options.from),
        to: String(options.to),
        resolution: options.resolution,
      });

      try {
        const response = await fetch(`${base}/${channel}/history?${params.toString()}`, {
          cache: "no-store",
          headers,
        });

        if (!response.ok) {
          continue;
        }

        const json = (await response.json()) as HistoryResponse;
        const candles = mapHistoryResponse(json);

        if (candles.length === 0) {
          continue;
        }

        return {
          candles,
          channel,
          symbol,
        };
      } catch {
        continue;
      }
    }
  }

  throw new Error("No Pyth candle data available");
}

export async function fetchPythCandles(options: {
  asset: AssetOption;
  from: number;
  to: number;
  resolution: string;
  channel?: string;
}): Promise<Candle[]> {
  const result = await fetchPythCandlesWithMeta(options);
  return result.candles;
}

export async function fetchLatestPriceSnapshots(assetKeys?: string[]): Promise<LivePriceSnapshot[]> {
  const assets = mergeAssets(
    await Promise.all(
      (assetKeys ?? ASSET_OPTIONS.map((asset) => asset.key)).map((key) =>
        resolveAssetOption(key),
      ),
    ),
  ).filter((asset) => asset.hermesId);

  if (assets.length === 0) {
    return [];
  }

  const params = new URLSearchParams();
  for (const asset of assets) {
    if (asset.hermesId) {
      params.append("ids[]", asset.hermesId);
    }
  }

  // Prepare headers with Pyth Pro token if available
  const headers: HeadersInit = {};
  const pythProToken = process.env.PYTH_PRO_ACCESS_TOKEN?.trim();
  if (pythProToken && pythProToken !== "replace_with_your_token_if_needed") {
    headers["Authorization"] = `Bearer ${pythProToken}`;
  }

  const response = await fetch(
    `${resolveHermesBaseUrl()}/v2/updates/price/latest?${params.toString()}`,
    { 
      cache: "no-store",
      headers,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch latest Hermes prices");
  }

  const json = (await response.json()) as HermesLatestResponse;
  const parsedById = new Map(
    (json.parsed ?? [])
      .filter((entry) => entry.id && entry.price)
      .map((entry) => [entry.id as string, entry.price as NonNullable<typeof entry.price>]),
  );

  return assets.flatMap((asset) => {
    const price = asset.hermesId ? parsedById.get(asset.hermesId) : undefined;
    if (!price || typeof price.expo !== "number" || typeof price.publish_time !== "number") {
      return [];
    }

    const latest = scaledIntegerToNumber(price.price, price.expo);
    const confidence = scaledIntegerToNumber(price.conf, price.expo);
    const relativeConfidencePct = latest === 0 ? 0 : (confidence / Math.abs(latest)) * 100;

    return [
      {
        assetKey: asset.key,
        symbol: asset.fullSymbol,
        price: latest,
        confidence,
        relativeConfidencePct,
        exponent: price.expo,
        publishTime: price.publish_time,
        publishTimeIso: new Date(price.publish_time * 1000).toISOString(),
        source: "hermes" as const,
      },
    ];
  });
}
