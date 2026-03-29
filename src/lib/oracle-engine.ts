import { ACTION_OPTIONS } from "@/lib/constants";
import { fetchPythCandlesWithMeta, resolveAssetOption } from "@/lib/pyth";
import type {
  Action,
  AiReport,
  Candle,
  Checkpoint,
  DecisionEvent,
  Difficulty,
  ReplaySession,
  RiskRules,
  Scenario,
  ScenarioRequestInput,
  ScenarioType,
  ScoreBreakdown,
  ShockEvent,
} from "@/lib/types";
import { average, clamp, createId, makeSeededRandom, percentChange } from "@/lib/utils";

type WindowMetrics = {
  totalChangePct: number;
  earlyChangePct: number;
  lateChangePct: number;
  averageRangePct: number;
  firstHalfRangePct: number;
  secondHalfRangePct: number;
  wickPct: number;
  signFlipRatio: number;
  directionConsistency: number;
  peakGainPct: number;
  troughLossPct: number;
  peakToClosePct: number;
  troughToClosePct: number;
  maxDrawdownPct: number;
};

type RealWindowSelection = {
  candles: Candle[];
  channel: string;
  symbol: string;
  score: number;
  reason: string;
};

const PATTERN_ACTIONS: Record<ScenarioType, [Action, Action, Action]> = {
  breakout: ["wait", "buy", "reduce"],
  crash: ["sell", "hedge", "wait"],
  chop: ["wait", "reduce", "hedge"],
  fakeout: ["wait", "sell", "hedge"],
  "slow-bleed": ["sell", "reduce", "wait"],
  "volatility-spike": ["hedge", "wait", "reduce"],
};

const SHOCK_NAMES: Record<ScenarioType, string> = {
  breakout: "liquidity vacuum",
  crash: "air pocket cascade",
  chop: "false range expansion",
  fakeout: "failed breakout wick",
  "slow-bleed": "late-session capitulation",
  "volatility-spike": "surprise volatility burst",
};

function scenarioDrift(type: ScenarioType, progress: number) {
  switch (type) {
    case "breakout":
      return progress < 0.55 ? 0.001 : 0.007;
    case "crash":
      return progress < 0.42 ? -0.001 : -0.008;
    case "chop":
      return Math.sin(progress * Math.PI * 6) * 0.002;
    case "fakeout":
      return progress < 0.45 ? 0.005 : progress < 0.62 ? -0.003 : -0.007;
    case "slow-bleed":
      return -0.0025 - progress * 0.0014;
    case "volatility-spike":
      return Math.sin(progress * Math.PI * 4) * 0.0015;
    default:
      return 0;
  }
}

function volatilityMultiplier(difficulty: Difficulty) {
  switch (difficulty) {
    case "easy":
      return 0.7;
    case "chaos":
      return 1.45;
    default:
      return 1;
  }
}

function resolutionForWindow(windowHours: number, difficulty: Difficulty) {
  if (windowHours <= 6 || difficulty === "chaos") {
    return "5";
  }

  if (windowHours >= 24) {
    return "30";
  }

  return "15";
}

function targetCandleCount(windowHours: number, resolutionMinutes: number) {
  return Math.max(Math.floor((windowHours * 60) / resolutionMinutes), 36);
}

function buildSyntheticCandles(
  startingPrice: number,
  windowHours: number,
  resolutionMinutes: number,
  type: ScenarioType,
  difficulty: Difficulty,
  seed: string,
) {
  const random = makeSeededRandom(seed);
  const total = targetCandleCount(windowHours, resolutionMinutes);
  const candles: Candle[] = [];
  const startTime = Date.now() - total * resolutionMinutes * 60 * 1000;
  let previousClose = startingPrice;

  for (let index = 0; index < total; index += 1) {
    const progress = index / Math.max(total - 1, 1);
    const drift = scenarioDrift(type, progress);
    const noise = (random() - 0.5) * 0.01 * volatilityMultiplier(difficulty);
    const bodyPct = drift + noise;
    const open = previousClose;
    const close = open * (1 + bodyPct);
    const wickScale = 0.0045 * volatilityMultiplier(difficulty) + Math.abs(noise) * 0.8;
    const high = Math.max(open, close) * (1 + wickScale + random() * 0.002);
    const low = Math.min(open, close) * (1 - wickScale * (0.85 + random() * 0.4));

    candles.push({
      time: startTime + index * resolutionMinutes * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: 1000 + random() * 4000,
    });

    previousClose = close;
  }

  return candles;
}

function measureWindow(candles: Candle[]): WindowMetrics {
  const startPrice = candles[0]?.open ?? 0;
  const endPrice = candles[candles.length - 1]?.close ?? 0;
  const earlyIndex = Math.max(Math.floor(candles.length * 0.35), 1);
  const lateIndex = Math.max(Math.floor(candles.length * 0.55), 1);
  const earlyPrice = candles[Math.min(earlyIndex, candles.length - 1)]?.close ?? endPrice;
  const latePrice = candles[Math.min(lateIndex, candles.length - 1)]?.close ?? startPrice;
  const half = Math.max(Math.floor(candles.length / 2), 1);
  const firstHalf = candles.slice(0, half);
  const secondHalf = candles.slice(-half);

  const rangePercents = candles.map(
    (candle) => ((candle.high - candle.low) / Math.max(candle.open, 1)) * 100,
  );
  const wickPercents = candles.map((candle) => {
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    return ((upperWick + lowerWick) / Math.max(candle.open, 1)) * 100;
  });

  let signFlips = 0;
  let previousDirection = 0;
  for (const candle of candles) {
    const direction = candle.close > candle.open ? 1 : candle.close < candle.open ? -1 : 0;
    if (previousDirection !== 0 && direction !== 0 && direction !== previousDirection) {
      signFlips += 1;
    }
    if (direction !== 0) {
      previousDirection = direction;
    }
  }

  let rollingPeak = startPrice;
  let maxDrawdownPct = 0;
  for (const candle of candles) {
    rollingPeak = Math.max(rollingPeak, candle.high);
    maxDrawdownPct = Math.max(
      maxDrawdownPct,
      Math.abs(percentChange(rollingPeak, candle.low)),
    );
  }

  const peakPrice = candles.reduce((best, candle) => Math.max(best, candle.high), startPrice);
  const troughPrice = candles.reduce((best, candle) => Math.min(best, candle.low), startPrice);
  const signFlipRatio = candles.length <= 1 ? 0 : signFlips / (candles.length - 1);

  return {
    totalChangePct: percentChange(startPrice, endPrice),
    earlyChangePct: percentChange(startPrice, earlyPrice),
    lateChangePct: percentChange(latePrice, endPrice),
    averageRangePct: average(rangePercents),
    firstHalfRangePct: average(
      firstHalf.map((candle) => ((candle.high - candle.low) / Math.max(candle.open, 1)) * 100),
    ),
    secondHalfRangePct: average(
      secondHalf.map((candle) => ((candle.high - candle.low) / Math.max(candle.open, 1)) * 100),
    ),
    wickPct: average(wickPercents),
    signFlipRatio,
    directionConsistency: 1 - signFlipRatio,
    peakGainPct: percentChange(startPrice, peakPrice),
    troughLossPct: percentChange(startPrice, troughPrice),
    peakToClosePct: percentChange(peakPrice, endPrice),
    troughToClosePct: percentChange(troughPrice, endPrice),
    maxDrawdownPct,
  };
}

function positive(value: number) {
  return Math.max(value, 0);
}

function scoreWindowMatch(metrics: WindowMetrics, type: ScenarioType) {
  switch (type) {
    case "breakout":
      return (
        positive(metrics.totalChangePct) * 4 +
        positive(metrics.lateChangePct) * 4 +
        positive(metrics.secondHalfRangePct - metrics.firstHalfRangePct) * 5 +
        metrics.directionConsistency * 12 +
        positive(metrics.peakGainPct + metrics.peakToClosePct) * 2
      );
    case "crash":
      return (
        positive(-metrics.totalChangePct) * 4 +
        positive(-metrics.lateChangePct) * 4 +
        metrics.maxDrawdownPct * 3 +
        metrics.directionConsistency * 10 +
        positive(metrics.secondHalfRangePct - metrics.firstHalfRangePct) * 2
      );
    case "chop":
      return (
        positive(8 - Math.abs(metrics.totalChangePct)) * 4 +
        metrics.signFlipRatio * 35 +
        positive(metrics.averageRangePct - 0.6) * 5 +
        positive(7 - Math.abs(metrics.lateChangePct)) * 2
      );
    case "fakeout":
      return (
        positive(metrics.earlyChangePct) * 3 +
        positive(-metrics.lateChangePct) * 4 +
        positive(metrics.peakGainPct) * 2 +
        positive(-metrics.peakToClosePct) * 5 +
        metrics.wickPct * 2 +
        positive(-metrics.totalChangePct) * 2
      );
    case "slow-bleed":
      return (
        positive(-metrics.totalChangePct) * 4 +
        positive(-metrics.lateChangePct) * 3 +
        metrics.directionConsistency * 14 +
        positive(6 - metrics.averageRangePct) * 5 +
        positive(10 - metrics.maxDrawdownPct) * 2
      );
    case "volatility-spike":
      return (
        metrics.averageRangePct * 6 +
        metrics.wickPct * 4 +
        Math.max(Math.abs(metrics.peakToClosePct), Math.abs(metrics.troughToClosePct)) * 4 +
        metrics.signFlipRatio * 24 +
        positive(metrics.secondHalfRangePct - metrics.firstHalfRangePct) * 2
      );
    default:
      return 0;
  }
}

function reasonForWindow(type: ScenarioType, metrics: WindowMetrics) {
  switch (type) {
    case "breakout":
      return `Late trend acceleration reached ${metrics.lateChangePct.toFixed(2)}% with range expansion from ${metrics.firstHalfRangePct.toFixed(2)}% to ${metrics.secondHalfRangePct.toFixed(2)}%.`;
    case "crash":
      return `Real window posted ${metrics.totalChangePct.toFixed(2)}% total change with ${metrics.maxDrawdownPct.toFixed(2)}% peak-to-trough damage.`;
    case "chop":
      return `Net move stayed at ${metrics.totalChangePct.toFixed(2)}% while the tape flipped direction ${Math.round(metrics.signFlipRatio * 100)}% of the time.`;
    case "fakeout":
      return `Early move reached ${metrics.peakGainPct.toFixed(2)}% before closing ${Math.abs(metrics.peakToClosePct).toFixed(2)}% off the peak.`;
    case "slow-bleed":
      return `Downtrend stayed controlled at ${metrics.averageRangePct.toFixed(2)}% average range while grinding ${metrics.totalChangePct.toFixed(2)}% lower.`;
    case "volatility-spike":
      return `Average range hit ${metrics.averageRangePct.toFixed(2)}% with large reversal pressure and wick density at ${metrics.wickPct.toFixed(2)}%.`;
    default:
      return "Selected on the strongest real historical pattern fit available.";
  }
}

function selectBestRealWindow(
  candles: Candle[],
  type: ScenarioType,
  targetCount: number,
  channel: string,
  symbol: string,
) {
  if (candles.length < targetCount) {
    return null;
  }

  let best: RealWindowSelection | null = null;

  for (let start = 0; start <= candles.length - targetCount; start += 1) {
    const slice = candles.slice(start, start + targetCount);
    const metrics = measureWindow(slice);
    const score = scoreWindowMatch(metrics, type);

    if (!best || score > best.score) {
      best = {
        candles: slice.map((candle) => ({ ...candle })),
        channel,
        symbol,
        score,
        reason: reasonForWindow(type, metrics),
      };
    }
  }

  return best;
}

function buildCheckpointIndices(candles: Candle[], shockIndex: number) {
  const first = clamp(Math.floor(candles.length * 0.28), 8, Math.max(candles.length - 9, 8));
  const second = clamp(shockIndex - 1, 10, Math.max(candles.length - 6, 10));
  const third = clamp(shockIndex + 4, 12, Math.max(candles.length - 3, 12));

  return [...new Set([first, second, third])].sort((left, right) => left - right);
}

export function applyShockMutation(
  candles: Candle[],
  shock: ShockEvent,
  _scenarioType: ScenarioType,
  difficulty: Difficulty,
) {
  const effect = shock.shockType === "crash" ? -1 : 1;
  const move = shock.magnitude * effect;
  const volatilityMultiplier = difficulty === "chaos" ? 1.8 : 1.3;
 
  for (let index = shock.candleIndex; index < candles.length; index += 1) {
    const candle = candles[index];
    const totalAfterShock = candles.length - shock.candleIndex;
    const stepsIn = index - shock.candleIndex + 1;
    const progress = stepsIn / totalAfterShock || 0;
    const currentMove = move * progress;

    // Drift the price
    candle.open += currentMove;
    candle.close += currentMove;

    // Volatility Expansion (Perfection Fix)
    const spreadPadding = Math.abs(currentMove) * (volatilityMultiplier - 1);
    candle.high += currentMove + spreadPadding;
    candle.low += currentMove - spreadPadding;

    // Confidence Simulation
    const baseConf = candle.close * 0.0008;
    candle.confidence = baseConf + spreadPadding * 0.5;

    candle.entropy = true;
  }
}

export function injectShock(
  candles: Candle[],
  type: ScenarioType,
  difficulty: Difficulty,
  seed: string,
): ShockEvent {
  const random = makeSeededRandom(`${seed}-shock`);
  const shockIndex = clamp(
    Math.floor(candles.length * (type === "fakeout" ? 0.48 : 0.62)) + Math.floor(random() * 3),
    8,
    candles.length - 6,
  );
  const magnitude = 0.9 + random() * (difficulty === "chaos" ? 1.2 : 0.75);
  const hidden = difficulty === "chaos" && random() > 0.4;
  const shockType = SHOCK_NAMES[type];
  const effectDescription = `A ${shockType} lands near checkpoint two and multiplies local wick pressure by ${magnitude.toFixed(
    1,
  )}x.`;

  return {
    id: createId("shock"),
    candleIndex: shockIndex,
    shockType,
    magnitude,
    hidden,
    effectDescription,
  };
}

function buildCheckpoints(candles: Candle[], type: ScenarioType, shock: ShockEvent): Checkpoint[] {
  const actions = PATTERN_ACTIONS[type];
  const checkpoints = buildCheckpointIndices(candles, shock.candleIndex);

  return checkpoints.map((candleIndex, index) => {
    const action = actions[index] ?? ACTION_OPTIONS[0];
    const fallbackActions = ACTION_OPTIONS.filter((item) => item !== action).slice(0, 2);

    return {
      id: `cp${index + 1}`,
      candleIndex,
      title:
        index === 0
          ? "Opening read"
          : index === 1
            ? "Pressure point"
            : "Recovery check",
      prompt:
        index === 0
          ? "The tape is compressing into a decision zone. What is your first disciplined move?"
          : index === 1
            ? "Volatility is jumping and the replay is leaning unstable. Commit before the edge disappears."
            : "The market has absorbed the shock. Choose the cleanest recovery action.",
      context:
        index === 0
          ? "Read structure before size."
          : index === 1
            ? "This checkpoint is closest to the entropy event."
            : "Recovery is scored more on control than aggression.",
      expectedBestAction: action,
      fallbackActions,
      riskNote:
        index === 1
          ? "Protect capital first if conviction is weak."
          : "Respect your own patience and leverage rules.",
      pressure: index === 1 ? "High" : index === 2 ? "Medium" : "Measured",
    };
  });
}

function summariseScenario(candles: Candle[]) {
  const startPrice = candles[0]?.open ?? 0;
  const endPrice = candles[candles.length - 1]?.close ?? 0;
  const volatilityPct =
    average(candles.map((candle) => ((candle.high - candle.low) / Math.max(candle.open, 1)) * 100));

  return {
    startPrice,
    endPrice,
    changePct: percentChange(startPrice, endPrice),
    volatilityPct,
  };
}

function gradeFromScore(total: number) {
  if (total >= 94) return "A+";
  if (total >= 88) return "A";
  if (total >= 82) return "A-";
  if (total >= 76) return "B";
  if (total >= 70) return "B-";
  if (total >= 64) return "C";
  return "D";
}

async function findRealScenarioWindow(options: {
  scenarioType: ScenarioType;
  asset: Scenario["asset"];
  resolution: string;
  targetCount: number;
  seed: string;
}) {
  const resolutionMinutes = Number(options.resolution) || 15;
  const random = makeSeededRandom(`${options.seed}-history`);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const searchSpanSeconds = options.targetCount * resolutionMinutes * 60 * 8;
  const anchorDays = [
    3 + Math.floor(random() * 18),
    24 + Math.floor(random() * 55),
    80 + Math.floor(random() * 90),
  ];

  const attempts = await Promise.allSettled(
    anchorDays.map(async (daysBack) => {
      const to = nowSeconds - daysBack * 24 * 60 * 60;
      const from = to - searchSpanSeconds;
      const result = await fetchPythCandlesWithMeta({
        asset: options.asset,
        from,
        to,
        resolution: options.resolution,
      });

      return selectBestRealWindow(
        result.candles,
        options.scenarioType,
        options.targetCount,
        result.channel,
        result.symbol,
      );
    }),
  );

  const winners = attempts
    .flatMap((attempt) => (attempt.status === "fulfilled" && attempt.value ? [attempt.value] : []))
    .sort((left, right) => right.score - left.score);

  if (winners.length === 0) {
    throw new Error("No suitable real historical window found");
  }

  return winners[0];
}

export async function buildScenario(input: ScenarioRequestInput): Promise<Scenario> {
  const asset = await resolveAssetOption(input.assetKey);
  const resolution = resolutionForWindow(input.windowHours, input.difficulty);
  const resolutionMinutes = Number(resolution) || 15;
  const createdAt = new Date().toISOString();
  const seed = [
    asset.key,
    input.scenarioType,
    input.difficulty,
    input.mode,
    input.windowHours,
    createdAt,
  ].join("-");
  const random = makeSeededRandom(seed);
  const candleCount = targetCandleCount(input.windowHours, resolutionMinutes);

  let candles: Candle[];
  let source: Scenario["source"] = "synthetic";
  let marketContext: Scenario["marketContext"];

  try {
    const realWindow = await findRealScenarioWindow({
      scenarioType: input.scenarioType,
      asset,
      resolution,
      targetCount: candleCount,
      seed,
    });

    candles = realWindow.candles;
    source = "pyth-history";
    marketContext = {
      windowStartTime: realWindow.candles[0]?.time ?? Date.now(),
      windowEndTime: realWindow.candles[realWindow.candles.length - 1]?.time ?? Date.now(),
      channel: realWindow.channel,
      symbol: realWindow.symbol,
      selectionScore: Math.round(realWindow.score),
      selectionReason: realWindow.reason,
    };
  } catch {
    candles = buildSyntheticCandles(
      asset.basePrice * (0.9 + random() * 0.18),
      input.windowHours,
      resolutionMinutes,
      input.scenarioType,
      input.difficulty,
      seed,
    );
    marketContext = {
      windowStartTime: candles[0]?.time ?? Date.now(),
      windowEndTime: candles[candles.length - 1]?.time ?? Date.now(),
      channel: "synthetic",
      symbol: asset.fullSymbol,
      selectionScore: 0,
      selectionReason: "Real Pyth history was unavailable, so the replay was generated from the fallback simulator.",
    };
  }
  const shockEvent = injectShock(candles, input.scenarioType, input.difficulty, seed);
  const checkpoints = buildCheckpoints(candles, input.scenarioType, shockEvent);
  checkpoints.forEach((checkpoint) => {
    const candle = candles[checkpoint.candleIndex];
    if (candle) {
      candle.checkpoint = true;
    }
  });

  // Initialize Confidence (Perfection Fix)
  const finalCandles = candles.map((candle) => ({
    ...candle,
    confidence: candle.confidence ?? candle.close * 0.0008,
  }));

  return {
    id: createId("scenario"),
    asset,
    scenarioType: input.scenarioType,
    difficulty: input.difficulty,
    mode: input.mode,
    windowHours: input.windowHours,
    resolution,
    createdAt,
    source,
    seed,
    riskRules: input.riskRules,
    candles: finalCandles,
    checkpoints,
    shockEvent,
    summary: summariseScenario(finalCandles),
    marketContext,
  };
}

export function scoreDecision(
  decision: Pick<DecisionEvent, "action" | "timerRemaining" | "confidence">,
  checkpoint: Checkpoint,
  riskRules: RiskRules,
  scenario: Scenario,
) {
  const isBest = decision.action === checkpoint.expectedBestAction;
  const isFallback = checkpoint.fallbackActions.includes(decision.action);
  const qualityRaw = isBest ? 28 : isFallback ? 17 : 6;
  const timingRaw = clamp(Math.round((decision.timerRemaining / 12) * 13), 0, 13);

  let riskRaw = 10;
  if (decision.confidence < riskRules.patienceThreshold && decision.action !== "wait") {
    riskRaw -= 3;
  }
  if (decision.action === "buy" && scenario.scenarioType === "crash") {
    riskRaw -= 4;
  }
  if (decision.action === "sell" && scenario.scenarioType === "breakout") {
    riskRaw -= 4;
  }
  if (decision.action === "hedge" || decision.action === "reduce") {
    riskRaw += 1;
  }

  const adaptRaw =
    checkpoint.candleIndex >= scenario.shockEvent.candleIndex
      ? decision.action === checkpoint.expectedBestAction ||
        decision.action === "hedge" ||
        decision.action === "reduce"
        ? 9
        : 3
      : 6;

  const penalties =
    (decision.timerRemaining === 0 ? 3 : 0) + (!isBest && !isFallback ? 2 : 0);

  return {
    qualityRaw,
    timingRaw,
    riskRaw: clamp(riskRaw, 0, 12),
    adaptRaw,
    penalties,
    impactScore: clamp(Math.round(qualityRaw + timingRaw + riskRaw), 0, 100),
  };
}

export function scoreSession(session: ReplaySession): ScoreBreakdown {
  const checkpointStats = session.scenario.checkpoints.map((checkpoint) => {
    const decision = session.decisions.find((item) => item.checkpointId === checkpoint.id);
    if (!decision) {
      return {
        qualityRaw: 0,
        timingRaw: 0,
        riskRaw: 0,
        adaptRaw: 0,
        penalties: 5,
      };
    }

    return scoreDecision(decision, checkpoint, session.scenario.riskRules, session.scenario);
  });

  const decisionQuality = clamp(
    Math.round((average(checkpointStats.map((item) => item.qualityRaw)) / 28) * 35),
    0,
    35,
  );
  const timingPrecision = clamp(
    Math.round((average(checkpointStats.map((item) => item.timingRaw)) / 13) * 25),
    0,
    25,
  );
  const riskDiscipline = clamp(
    Math.round((average(checkpointStats.map((item) => item.riskRaw)) / 12) * 20),
    0,
    20,
  );
  const adaptability = clamp(
    Math.round((average(checkpointStats.map((item) => item.adaptRaw)) / 9) * 10),
    0,
    10,
  );

  let consistency = 10;
  for (let index = 1; index < session.decisions.length; index += 1) {
    const previous = session.decisions[index - 1];
    const current = session.decisions[index];
    if (
      (previous.action === "buy" && current.action === "sell") ||
      (previous.action === "sell" && current.action === "buy")
    ) {
      consistency -= 3;
    }
    if (Math.abs(previous.confidence - current.confidence) > 30) {
      consistency -= 1;
    }
  }
  consistency = clamp(consistency, 0, 10);

  const penalties = clamp(
    checkpointStats.reduce((sum, item) => sum + item.penalties, 0),
    0,
    12,
  );

  const total = clamp(
    decisionQuality + timingPrecision + riskDiscipline + adaptability + consistency - penalties,
    0,
    100,
  );

  return {
    decisionQuality,
    timingPrecision,
    riskDiscipline,
    adaptability,
    consistency,
    penalties,
    total,
    grade: gradeFromScore(total),
  };
}

export function generateAiReport(session: ReplaySession, score: ScoreBreakdown): AiReport {
  const correctDecisions = session.decisions.filter(
    (decision) =>
      decision.action ===
      session.scenario.checkpoints.find((checkpoint) => checkpoint.id === decision.checkpointId)
        ?.expectedBestAction,
  );
  const missedDecisions = session.scenario.checkpoints.filter(
    (checkpoint) =>
      !session.decisions.some((decision) => decision.checkpointId === checkpoint.id),
  );

  const bestDimension = [
    { label: "timing precision", value: score.timingPrecision },
    { label: "risk discipline", value: score.riskDiscipline },
    { label: "adaptability", value: score.adaptability },
  ].sort((left, right) => right.value - left.value)[0];

  const weakestDimension = [
    { label: "decision quality", value: score.decisionQuality },
    { label: "timing precision", value: score.timingPrecision },
    { label: "risk discipline", value: score.riskDiscipline },
    { label: "adaptability", value: score.adaptability },
    { label: "consistency", value: score.consistency },
  ].sort((left, right) => left.value - right.value)[0];

  // Archetype Logic (V3 Perfection)
  let archetype = "The Balanced Drill";
  let archetypeDescription = "A steady hand navigating the oracle simulation.";

  if (score.timingPrecision > 16 && score.riskDiscipline > 16) {
    archetype = "The Oracle Disciple";
    archetypeDescription =
      "Exhibits near-perfect synchronization with Pyth price updates and extreme risk control.";
  } else if (score.adaptability > 16) {
    archetype = "The Diamond Hand";
    archetypeDescription =
      "Successfully absorbed market shocks without wavering from the primary thesis.";
  } else if (score.riskDiscipline < 10 && score.timingPrecision > 14) {
    archetype = "The Degenerate Trader";
    archetypeDescription =
      "Excellent timing, but reckless disregard for drawdown limits. A dangerous combination.";
  } else if (score.adaptability < 8 && score.riskDiscipline > 15) {
    archetype = "The Panic Seller";
    archetypeDescription =
      "High safety focus, but likely stops out too early during oracle volatility.";
  } else if (score.decisionQuality > 35) {
    archetype = "The Risk Architect";
    archetypeDescription =
      "Systematic and cold. Every decision carries the weight of a professional thesis.";
  }

  return {
    summary: `You finished the ${session.scenario.scenarioType.replace(
      "-",
      " ",
    )} drill at ${score.total}/100 (${score.grade}). The strongest signal was ${bestDimension.label}, while ${weakestDimension.label} is the next thing to harden.`,
    archetype,
    archetypeDescription,
    whatWentRight: [
      correctDecisions.length > 0
        ? `Matched the optimal path on ${correctDecisions.length} checkpoint${correctDecisions.length > 1 ? "s" : ""}.`
        : "Stayed alive through the full replay and completed the drill.",
      `Handled ${session.scenario.shockEvent.shockType} conditions with a ${score.adaptability}/10 adaptability score.`,
      `Finished with ${score.riskDiscipline}/20 on discipline against your own rules.`,
    ],
    whatWentWrong: [
      weakestDimension.value < 10
        ? `The weakest dimension was ${weakestDimension.label}, which kept the grade from climbing.`
        : `There is still room to sharpen ${weakestDimension.label}.`,
      missedDecisions.length > 0
        ? `Missed ${missedDecisions.length} checkpoint${missedDecisions.length > 1 ? "s" : ""}, which cost timing and quality points.`
        : "No checkpoints were missed, but some answers were lower-conviction than the tape demanded.",
      score.penalties > 0
        ? `Penalty stack reached ${score.penalties}, mostly from late or low-edge responses.`
        : "Penalty stack stayed contained, which is a positive signal.",
    ],
    nextDrill: `Repeat this setup once in human mode and once in agent mode, aiming to improve ${weakestDimension.label} without sacrificing risk discipline.`,
    verdict:
      score.total >= 85
        ? "Verdict: you are ready for a sharper chaos-mode run."
        : "Verdict: keep the structure, but tighten discipline before turning up the volatility.",
  };
}
