import { DEFAULT_RISK_RULES } from "@/lib/constants";
import type {
  Action,
  Difficulty,
  ReplayMode,
  ScenarioRequestInput,
  ScenarioType,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

const scenarioTypes = new Set<ScenarioType>([
  "breakout",
  "crash",
  "chop",
  "fakeout",
  "slow-bleed",
  "volatility-spike",
]);

const difficulties = new Set<Difficulty>(["easy", "medium", "chaos"]);
const modes = new Set<ReplayMode>(["human", "agent"]);
const actions = new Set<Action>(["buy", "sell", "hold", "reduce", "wait", "hedge"]);

function asRecord(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  return payload as Record<string, unknown>;
}

export function parseScenarioInput(payload: unknown): ScenarioRequestInput {
  const body = asRecord(payload);

  const scenarioType = scenarioTypes.has(body.scenarioType as ScenarioType)
    ? (body.scenarioType as ScenarioType)
    : "breakout";
  const difficulty = difficulties.has(body.difficulty as Difficulty)
    ? (body.difficulty as Difficulty)
    : "medium";
  const mode = modes.has(body.mode as ReplayMode) ? (body.mode as ReplayMode) : "human";
  const riskInput = asRecord(body.riskRules);

  return {
    assetKey: typeof body.assetKey === "string" ? body.assetKey : "BTC",
    scenarioType,
    difficulty,
    windowHours:
      typeof body.windowHours === "number" ? clamp(body.windowHours, 6, 24) : 12,
    mode,
    riskRules: {
      maxLossPct:
        typeof riskInput.maxLossPct === "number"
          ? clamp(riskInput.maxLossPct, 1, 10)
          : DEFAULT_RISK_RULES.maxLossPct,
      cooldownBars:
        typeof riskInput.cooldownBars === "number"
          ? clamp(riskInput.cooldownBars, 1, 8)
          : DEFAULT_RISK_RULES.cooldownBars,
      leverageCap:
        typeof riskInput.leverageCap === "number"
          ? clamp(riskInput.leverageCap, 1, 5)
          : DEFAULT_RISK_RULES.leverageCap,
      patienceThreshold:
        typeof riskInput.patienceThreshold === "number"
          ? clamp(riskInput.patienceThreshold, 40, 95)
          : DEFAULT_RISK_RULES.patienceThreshold,
    },
  };
}

export function parseDecisionInput(payload: unknown) {
  const body = asRecord(payload);
  const action = actions.has(body.action as Action) ? (body.action as Action) : "wait";
  const actor: "human" | "agent" = body.actor === "agent" ? "agent" : "human";

  return {
    checkpointId: typeof body.checkpointId === "string" ? body.checkpointId : "",
    action,
    confidence: typeof body.confidence === "number" ? clamp(body.confidence, 0, 100) : 50,
    reason: typeof body.reason === "string" ? body.reason : "",
    timerRemaining:
      typeof body.timerRemaining === "number" ? clamp(body.timerRemaining, 0, 12) : 0,
    actor,
  };
}
