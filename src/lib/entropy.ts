import {
  Contract,
  Interface,
  JsonRpcProvider,
  isAddress,
  Wallet,
  ZeroHash,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import type { EntropySessionState, ReplaySession } from "@/lib/types";
import { average, percentChange } from "@/lib/utils";

const DEFAULT_CALLBACK_GAS_LIMIT = 180_000;
const DEFAULT_EXPLORER_URL = "https://entropy-explorer.pyth.network";

import { applyShockMutation } from "@/lib/oracle-engine";
const CONSUMER_ABI = [
  "function entropy() view returns (address)",
  "function quoteFee(uint32 gasLimit) view returns (uint256)",
  "function requestShock(bytes32 sessionKey, uint32 gasLimit) payable returns (uint64 sequenceNumber)",
  "function getSessionRequest(bytes32 sessionKey) view returns (uint64 sequenceNumber, address provider, bytes32 randomNumber, uint32 callbackGasLimit, uint64 requestedAtBlock, uint64 fulfilledAtBlock, bool fulfilled)",
];

const REVEALED_EVENT_ABI = [
  "event Revealed(address indexed provider, address indexed caller, uint64 indexed sequenceNumber, bytes32 randomNumber, bytes32 userContribution, bytes32 providerContribution, bool callbackFailed, bytes callbackReturnValue, uint32 callbackGasUsed, bytes extraArgs)",
];

type EntropyRuntimeSnapshot = {
  enabled: boolean;
  chainName: string;
  chainId: number;
  consumerAddress: string;
  explorerUrl: string;
  callbackGasLimit: number;
};

type EntropyConfig = EntropyRuntimeSnapshot & {
  rpcUrl: string;
  requesterPrivateKey: string;
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isValidPrivateKey(value: string | undefined) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value.trim()));
}

function resolveEntropyConfig(): EntropyConfig | null {
  const rpcUrl = process.env.ENTROPY_RPC_URL?.trim();
  const consumerAddress = process.env.ENTROPY_CONSUMER_ADDRESS?.trim();
  const requesterPrivateKey = process.env.ENTROPY_REQUESTER_PRIVATE_KEY?.trim();

  if (
    !rpcUrl ||
    !consumerAddress ||
    !requesterPrivateKey ||
    !isAddress(consumerAddress) ||
    !isValidPrivateKey(requesterPrivateKey)
  ) {
    return null;
  }

  return {
    enabled: true,
    rpcUrl,
    requesterPrivateKey,
    consumerAddress,
    chainId: parsePositiveInt(process.env.ENTROPY_CHAIN_ID, 84532),
    chainName: process.env.ENTROPY_CHAIN_NAME?.trim() || "Base Sepolia",
    explorerUrl: process.env.ENTROPY_EXPLORER_URL?.trim() || DEFAULT_EXPLORER_URL,
    callbackGasLimit: parsePositiveInt(
      process.env.ENTROPY_CALLBACK_GAS_LIMIT,
      DEFAULT_CALLBACK_GAS_LIMIT,
    ),
  };
}

function buildProvider(config: EntropyConfig) {
  return new JsonRpcProvider(config.rpcUrl, config.chainId);
}

function buildSessionKey(sessionId: string) {
  return keccak256(toUtf8Bytes(`oracle-gym:${sessionId}`));
}

function unitFromRandom(randomNumber: string, label: string) {
  const hash = keccak256(toUtf8Bytes(`${randomNumber}:${label}`));
  return parseInt(hash.slice(2, 10), 16) / 0xffffffff;
}

function formatEntropyNote(state: EntropySessionState) {
  if (state.status === "fulfilled") {
    return "Live Entropy V2 callback succeeded and updated the scenario shock.";
  }

  if (state.status === "callback-failed") {
    return "Entropy revealed a random number, but the callback failed on-chain. Local fallback shock remains active.";
  }

  if (state.status === "pending") {
    return "Waiting for the Entropy reveal transaction and callback.";
  }

  if (state.status === "tx-failed") {
    return "Entropy request transaction failed, so the replay is running on the local fallback shock.";
  }

  return "Entropy is not configured for this deployment.";
}

function difficultyGasLimit(session: ReplaySession, config: EntropyConfig) {
  if (session.scenario.difficulty === "chaos") {
    return Math.max(config.callbackGasLimit, 220_000);
  }

  if (session.scenario.difficulty === "easy") {
    return Math.max(140_000, Math.min(config.callbackGasLimit, 170_000));
  }

  return config.callbackGasLimit;
}

async function findRevealForSequence(options: {
  provider: JsonRpcProvider;
  entropyAddress: string;
  consumerAddress: string;
  sequenceNumber: string;
  requestBlockNumber?: number;
}) {
  const entropyInterface = new Interface(REVEALED_EVENT_ABI);
  const topics = entropyInterface.encodeFilterTopics("Revealed", [
    null,
    options.consumerAddress,
    BigInt(options.sequenceNumber),
  ]);

  const logs = await options.provider.getLogs({
    address: options.entropyAddress,
    topics,
    fromBlock: BigInt(Math.max((options.requestBlockNumber ?? 0) - 2, 0)),
    toBlock: "latest",
  });

  const latest = logs.at(-1);
  if (!latest) {
    return null;
  }

  const parsed = entropyInterface.parseLog(latest);
  if (!parsed) {
    return null;
  }

  const block = await options.provider.getBlock(latest.blockNumber);

  return {
    randomNumber: parsed.args.randomNumber as string,
    callbackFailed: parsed.args.callbackFailed as boolean,
    callbackGasUsed: Number(parsed.args.callbackGasUsed),
    revealTxHash: latest.transactionHash,
    resolvedAt: block ? new Date(Number(block.timestamp) * 1000).toISOString() : undefined,
  };
}

function applyLiveEntropyShock(session: ReplaySession, entropyState: EntropySessionState) {
  if (!entropyState.randomNumber || entropyState.callbackFailed || entropyState.applied) {
    session.entropy = {
      ...entropyState,
      note: formatEntropyNote(entropyState),
    };
    return session;
  }

  const randomNumber = entropyState.randomNumber;
  const candles = session.scenario.candles.map((candle) => ({ ...candle }));
  const shockIndex = session.scenario.shockEvent.candleIndex;
  const difficultyMultiplier =
    session.scenario.difficulty === "chaos"
      ? 1.25
      : session.scenario.difficulty === "easy"
        ? 0.7
        : 1;
  const direction =
    session.scenario.scenarioType === "crash" ||
    session.scenario.scenarioType === "fakeout" ||
    session.scenario.scenarioType === "slow-bleed"
      ? -1
      : 1;
  const hidden =
    session.scenario.difficulty === "easy" ? false : unitFromRandom(randomNumber, "hidden") > 0.57;
  const magnitude = Number(
    Math.min(
      2.5,
      Math.max(
        0.85,
        session.scenario.shockEvent.magnitude +
          (unitFromRandom(randomNumber, "magnitude") - 0.5) * 0.9 * difficultyMultiplier,
      ),
    ).toFixed(2),
  );
  const impulseBase = (0.0016 + unitFromRandom(randomNumber, "impulse") * 0.004) * difficultyMultiplier;

  for (let index = shockIndex; index < Math.min(shockIndex + 3, candles.length); index += 1) {
    const candle = candles[index];
    const impulse = impulseBase * magnitude * direction;
    candle.close = candle.close * (1 + impulse);
    candle.high = Math.max(candle.high, Math.max(candle.open, candle.close) * (1 + impulseBase * 2.2));
    candle.low = Math.min(candle.low, Math.min(candle.open, candle.close) * (1 - impulseBase * 2.2));
    candle.entropy = true;
  }

  recalculateScenarioSummary(session, candles);

  session.scenario.candles = candles;
  session.scenario.shockEvent = {
    ...session.scenario.shockEvent,
    hidden,
    magnitude,
    effectDescription: `Live Entropy V2 resolved on ${entropyState.chainName}. Randomness produced a ${
      hidden ? "hidden" : "visible"
    } ${session.scenario.shockEvent.shockType} at ${magnitude.toFixed(2)}x intensity.`,
  };
  session.entropy = {
    ...entropyState,
    applied: true,
    note: formatEntropyNote(entropyState),
  };

  return session;
}

function recalculateScenarioSummary(session: ReplaySession, candles = session.scenario.candles) {
  const startPrice = candles[0]?.open ?? 0;
  const endPrice = candles[candles.length - 1]?.close ?? 0;

  session.scenario.summary = {
    startPrice,
    endPrice,
    changePct: percentChange(startPrice, endPrice),
    volatilityPct: average(
      candles.map((candle) => ((candle.high - candle.low) / Math.max(candle.open, 1)) * 100),
    ),
  };
}

export function getEntropyRuntimeSnapshot(): EntropyRuntimeSnapshot {
  const config = resolveEntropyConfig();

  return {
    enabled: Boolean(config),
    chainName: config?.chainName ?? "Not configured",
    chainId: config?.chainId ?? 0,
    consumerAddress: config?.consumerAddress ?? "Not configured",
    explorerUrl: config?.explorerUrl ?? DEFAULT_EXPLORER_URL,
    callbackGasLimit: config?.callbackGasLimit ?? DEFAULT_CALLBACK_GAS_LIMIT,
  };
}

export function initializeEntropyState(session: ReplaySession) {
  if (session.entropy) {
    return session;
  }

  const snapshot = getEntropyRuntimeSnapshot();
  session.entropy = {
    enabled: snapshot.enabled,
    source: snapshot.enabled ? "pyth-entropy-v2" : "local-fallback",
    status: snapshot.enabled ? "idle" : "disabled",
    sessionKey: buildSessionKey(session.id),
    chainName: snapshot.chainName,
    chainId: snapshot.chainId || undefined,
    consumerAddress: snapshot.enabled ? snapshot.consumerAddress : undefined,
    explorerUrl: snapshot.explorerUrl,
    callbackGasLimit: snapshot.callbackGasLimit,
    note: snapshot.enabled
      ? "Ready to request a live Entropy V2 shock for this replay."
      : "Entropy is not configured, so the replay uses the local fallback shock.",
    applied: false,
  };

  // If Entropy is disabled, apply the fallback shock mutation immediately
  if (!snapshot.enabled) {
    applyShockMutation(
      session.scenario.candles,
      session.scenario.shockEvent,
      session.scenario.scenarioType,
      session.scenario.difficulty,
    );
    recalculateScenarioSummary(session);
    session.entropy.applied = true;
  }

  return session;
}

export async function armEntropyForSession(session: ReplaySession) {
  initializeEntropyState(session);

  if (!session.entropy || !session.entropy.enabled) {
    return session;
  }

  if (
    session.entropy.status === "pending" ||
    session.entropy.status === "fulfilled" ||
    session.entropy.status === "callback-failed"
  ) {
    return session;
  }

  const config = resolveEntropyConfig();
  if (!config) {
    session.entropy = {
      ...session.entropy,
      enabled: false,
      source: "local-fallback",
      status: "disabled",
      note: formatEntropyNote({
        ...session.entropy,
        status: "disabled",
      }),
    };
    return session;
  }

  const provider = buildProvider(config);
  const signer = new Wallet(config.requesterPrivateKey, provider);
  const consumer = new Contract(config.consumerAddress, CONSUMER_ABI, signer);
  const gasLimit = difficultyGasLimit(session, config);

  try {
    session.entropy = {
      ...session.entropy,
      status: "requesting",
      callbackGasLimit: gasLimit,
      error: undefined,
      note: "Submitting Entropy V2 request transaction...",
    };

    const fee = await consumer.quoteFee(gasLimit);
    const sequenceNumber = await consumer.requestShock.staticCall(
      session.entropy.sessionKey,
      gasLimit,
      { value: fee },
    );
    const tx = await consumer.requestShock(session.entropy.sessionKey, gasLimit, {
      value: fee,
    });
    const receipt = await tx.wait();
    const confirmedRequest = (await consumer.getSessionRequest(session.entropy.sessionKey)) as {
      sequenceNumber: bigint;
      provider: string;
      randomNumber: string;
      callbackGasLimit: number;
      requestedAtBlock: bigint;
      fulfilledAtBlock: bigint;
      fulfilled: boolean;
    };
    const confirmedSequenceNumber =
      confirmedRequest.sequenceNumber && confirmedRequest.sequenceNumber !== BigInt(0)
        ? confirmedRequest.sequenceNumber
        : sequenceNumber;

    session.entropy = {
      ...session.entropy,
      status: "pending",
      source: "pyth-entropy-v2",
      callbackGasLimit: gasLimit,
      sequenceNumber: confirmedSequenceNumber.toString(),
      requestTxHash: tx.hash,
      requestBlockNumber: receipt?.blockNumber,
      requestedAt: new Date().toISOString(),
      note: "Entropy request confirmed. Waiting for reveal and callback.",
    };
  } catch (error) {
    session.entropy = {
      ...session.entropy,
      source: "local-fallback",
      status: "tx-failed",
      error: error instanceof Error ? error.message : "Unknown entropy request error",
      note: formatEntropyNote({
        ...session.entropy,
        status: "tx-failed",
      }),
    };

    // Apply fallback shock on failure
    applyShockMutation(
      session.scenario.candles,
      session.scenario.shockEvent,
      session.scenario.scenarioType,
      session.scenario.difficulty,
    );
    recalculateScenarioSummary(session);
    session.entropy.applied = true;
  }

  return session;
}

export async function syncEntropyForSession(session: ReplaySession) {
  initializeEntropyState(session);

  if (!session.entropy || !session.entropy.enabled || !session.entropy.sequenceNumber) {
    return session;
  }

  if (session.entropy.status === "callback-failed") {
    session.entropy = {
      ...session.entropy,
      note: formatEntropyNote(session.entropy),
    };
    return session;
  }

  const config = resolveEntropyConfig();
  if (!config) {
    return session;
  }

  const provider = buildProvider(config);
  const consumer = new Contract(config.consumerAddress, CONSUMER_ABI, provider);

  try {
    const entropyAddress = (await consumer.entropy()) as string;
    const request = (await consumer.getSessionRequest(session.entropy.sessionKey)) as {
      sequenceNumber: bigint;
      provider: string;
      randomNumber: string;
      callbackGasLimit: number;
      requestedAtBlock: bigint;
      fulfilledAtBlock: bigint;
      fulfilled: boolean;
    };

    if (request.fulfilled && request.randomNumber !== ZeroHash) {
      session.entropy = {
        ...session.entropy,
        source: "pyth-entropy-v2",
        status: "fulfilled",
        entropyAddress,
        randomNumber: request.randomNumber,
        callbackFailed: false,
        resolvedAt:
          session.entropy.resolvedAt ??
          new Date().toISOString(),
      };

      return applyLiveEntropyShock(session, session.entropy);
    }

    const reveal = await findRevealForSequence({
      provider,
      entropyAddress,
      consumerAddress: config.consumerAddress,
      sequenceNumber: session.entropy.sequenceNumber,
      requestBlockNumber: session.entropy.requestBlockNumber,
    });

    if (!reveal) {
      session.entropy = {
        ...session.entropy,
        source: "pyth-entropy-v2",
        status: "pending",
        entropyAddress,
        note: formatEntropyNote({
          ...session.entropy,
          status: "pending",
        }),
      };
      return session;
    }

    session.entropy = {
      ...session.entropy,
      source: "pyth-entropy-v2",
      status: reveal.callbackFailed ? "callback-failed" : "fulfilled",
      entropyAddress,
      randomNumber: reveal.randomNumber,
      callbackFailed: reveal.callbackFailed,
      callbackGasUsed: reveal.callbackGasUsed,
      revealTxHash: reveal.revealTxHash,
      resolvedAt: reveal.resolvedAt,
    };

    if (reveal.callbackFailed) {
      // Revert to fallback shock if callback failed
      applyShockMutation(
        session.scenario.candles,
        session.scenario.shockEvent,
        session.scenario.scenarioType,
        session.scenario.difficulty,
      );
      recalculateScenarioSummary(session);
      session.entropy.applied = true;
      session.entropy.note = formatEntropyNote(session.entropy);
      return session;
    }

    return applyLiveEntropyShock(session, session.entropy);
  } catch (error) {
    session.entropy = {
      ...session.entropy,
      error: error instanceof Error ? error.message : "Unknown entropy sync error",
      note: "Could not sync Entropy status from the configured RPC right now.",
    };
    return session;
  }
}
