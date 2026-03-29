import { armEntropyForSession, initializeEntropyState, syncEntropyForSession } from "@/lib/entropy";
import { SEEDED_HISTORY } from "@/lib/constants";
import { LEGACY_OWNER_ID, DEFAULT_OWNER_BALANCE, normalizeOwnerId } from "@/lib/ownership";
import { generateAiReport, scoreDecision, scoreSession } from "@/lib/oracle-engine";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Action, HistoryEntry, ReplaySession, Scenario, UserStats } from "@/lib/types";
import { createId, formatTimestampLabel } from "@/lib/utils";

// ── Gamification constants ────────────────────────────────────
const XP_PER_POINT       = 2.5;   // XP = score * 2.5 (matches credit reward)
const DAILY_BONUS_XP     = 50;    // first drill of the day
const DAILY_BONUS_COINS  = 100;   // first drill of the day
const XP_PER_LEVEL       = 500;   // XP needed per level
const WELCOME_COINS      = 1000;  // granted on first wallet connection
const STREAK_MULTIPLIER_PER_DAY = 2; // coins × (streak_day * 2), max 7 days

function xpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcStreakMultiplier(streak: number): number {
  // Day 1 = ×2, Day 2 = ×4 ... Day 7 = ×14, cap at 7 days
  return Math.min(streak, 7) * STREAK_MULTIPLIER_PER_DAY;
}

type OwnedScenario = Scenario & { ownerId: string };
type OwnedReplaySession = ReplaySession & { ownerId: string };

type OwnerGameState = {
  balance: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  dailyBonusClaimedDate: string | null;
  isFirstLogin: boolean;
  lastStreakClaimDate: string | null;
};

type StoreShape = {
  scenarios: Map<string, OwnedScenario>;
  sessions: Map<string, OwnedReplaySession>;
  balancesByOwner: Record<string, number>;
  gameStateByOwner: Record<string, OwnerGameState>;
};

type LegacyStoreShape = Partial<StoreShape> & {
  balance?: number;
  gameStateByOwner?: Record<string, Partial<OwnerGameState>>;
};

declare global {
  var __oracleGymStore: StoreShape | undefined;
}

type PersistedStoreSnapshotV1 = {
  version: 1;
  balance: number;
  scenarios: Scenario[];
  sessions: ReplaySession[];
  savedAt: string;
};

type PersistedStoreSnapshotV2 = {
  version: 2;
  balancesByOwner: Record<string, number>;
  gameStateByOwner?: Record<string, OwnerGameState>;
  scenarios: OwnedScenario[];
  sessions: OwnedReplaySession[];
  savedAt: string;
};

type PersistedStoreSnapshot = PersistedStoreSnapshotV1 | PersistedStoreSnapshotV2;

const resolvedStorePath = process.env.ORACLE_GYM_STORE_PATH?.trim();
const STORE_PATH = resolvedStorePath
  ? resolve(/* turbopackIgnore: true */ process.cwd(), resolvedStorePath)
  : join(/* turbopackIgnore: true */ process.cwd(), ".data", "oracle-gym-store.json");

let cachedStore: StoreShape | undefined;
let persistenceWarningLogged = false;

function createDefaultStore(): StoreShape {
  return {
    scenarios: new Map<string, OwnedScenario>(),
    sessions: new Map<string, OwnedReplaySession>(),
    balancesByOwner: {},
    gameStateByOwner: {},
  };
}

function defaultGameState(balance = DEFAULT_OWNER_BALANCE): OwnerGameState {
  return { balance, xp: 0, level: 1, streak: 0, lastActiveDate: null, dailyBonusClaimedDate: null, isFirstLogin: true, lastStreakClaimDate: null };
}

function normalizeOwnedScenario(scenario: Scenario, ownerId = LEGACY_OWNER_ID): OwnedScenario {
  return {
    ...scenario,
    ownerId: normalizeOwnerId(scenario.ownerId) ?? ownerId,
  };
}

function normalizeOwnedSession(session: ReplaySession): OwnedReplaySession {
  const ownerId = normalizeOwnerId(session.ownerId) ?? LEGACY_OWNER_ID;

  return {
    ...session,
    ownerId,
    scenario: normalizeOwnedScenario(session.scenario, ownerId),
  };
}

function hydrateStore(snapshot: PersistedStoreSnapshot): StoreShape {
  const store = createDefaultStore();

  if (snapshot.version === 1) {
    store.balancesByOwner[LEGACY_OWNER_ID] = Number.isFinite(snapshot.balance)
      ? snapshot.balance
      : DEFAULT_OWNER_BALANCE;

    for (const scenario of snapshot.scenarios) {
      if (scenario?.id) {
        store.scenarios.set(scenario.id, normalizeOwnedScenario(scenario));
      }
    }

    for (const session of snapshot.sessions) {
      if (session?.id) {
        store.sessions.set(session.id, normalizeOwnedSession(session));
      }
    }

    return store;
  }

  for (const [ownerId, balance] of Object.entries(snapshot.balancesByOwner ?? {})) {
    if (Number.isFinite(balance)) {
      store.balancesByOwner[ownerId] = balance;
    }
  }

  for (const scenario of snapshot.scenarios) {
    if (scenario?.id) {
      store.scenarios.set(scenario.id, normalizeOwnedScenario(scenario, scenario.ownerId));
    }
  }

  for (const session of snapshot.sessions) {
    if (session?.id) {
      store.sessions.set(session.id, normalizeOwnedSession(session));
    }
  }

  return store;
}

function serializeStore(store: StoreShape): PersistedStoreSnapshot {
  return {
    version: 2,
    balancesByOwner: store.balancesByOwner,
    gameStateByOwner: store.gameStateByOwner,
    scenarios: [...store.scenarios.values()],
    sessions: [...store.sessions.values()],
    savedAt: new Date().toISOString(),
  };
}

function loadStoreFromDisk(): StoreShape | null {
  if (!existsSync(STORE_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    if (!raw.trim()) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedStoreSnapshot>;
    if (parsed.version !== 1 && parsed.version !== 2) {
      return null;
    }

    if (parsed.version === 1) {
      return hydrateStore({
        version: 1,
        balance: typeof parsed.balance === "number" ? parsed.balance : DEFAULT_OWNER_BALANCE,
        scenarios: Array.isArray(parsed.scenarios) ? (parsed.scenarios as Scenario[]) : [],
        sessions: Array.isArray(parsed.sessions) ? (parsed.sessions as ReplaySession[]) : [],
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      });
    }

    return hydrateStore({
      version: 2,
      balancesByOwner:
        (parsed as Partial<PersistedStoreSnapshotV2>).balancesByOwner &&
        typeof (parsed as Partial<PersistedStoreSnapshotV2>).balancesByOwner === "object"
          ? ((parsed as Partial<PersistedStoreSnapshotV2>).balancesByOwner as Record<string, number>)
          : {},
      scenarios: Array.isArray(parsed.scenarios) ? (parsed.scenarios as OwnedScenario[]) : [],
      sessions: Array.isArray(parsed.sessions) ? (parsed.sessions as OwnedReplaySession[]) : [],
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

function persistStore(store: StoreShape) {
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(serializeStore(store), null, 2), "utf8");
  } catch (error) {
    if (!persistenceWarningLogged && process.env.NODE_ENV !== "production") {
      persistenceWarningLogged = true;
      const message = error instanceof Error ? error.message : "Unknown persistence error";
      console.warn(`Pyth Oracle Gym store persistence is using memory fallback: ${message}`);
    }
  }
}

function getStore(): StoreShape {
  if (!cachedStore) {
    cachedStore = normalizeStoreShape(
      globalThis.__oracleGymStore ?? loadStoreFromDisk() ?? createDefaultStore(),
    );
    globalThis.__oracleGymStore = cachedStore;
  }

  cachedStore = normalizeStoreShape(cachedStore);
  globalThis.__oracleGymStore = cachedStore;
  return cachedStore;
}

function normalizeStoreShape(store: StoreShape | LegacyStoreShape): StoreShape {
  const normalized = store as StoreShape & LegacyStoreShape;

  if (!(normalized.scenarios instanceof Map)) {
    normalized.scenarios = new Map<string, OwnedScenario>();
  }

  if (!(normalized.sessions instanceof Map)) {
    normalized.sessions = new Map<string, OwnedReplaySession>();
  }

  if (!normalized.balancesByOwner) {
    normalized.balancesByOwner = {};
  }

  if (!normalized.gameStateByOwner) {
    normalized.gameStateByOwner = {};
  }

  if (
    normalized.balance !== undefined &&
    normalized.balancesByOwner[LEGACY_OWNER_ID] === undefined
  ) {
    normalized.balancesByOwner[LEGACY_OWNER_ID] = normalized.balance;
    delete normalized.balance;
  }

  for (const scenario of normalized.scenarios.values()) {
    if (!scenario.ownerId) {
      scenario.ownerId = LEGACY_OWNER_ID;
    }
  }

  for (const session of normalized.sessions.values()) {
    if (!session.ownerId) {
      session.ownerId = LEGACY_OWNER_ID;
    }

    if (!session.scenario.ownerId) {
      session.scenario.ownerId = session.ownerId;
    }
  }

  return normalized as StoreShape;
}

// ── Game state helpers ────────────────────────────────────────
function getOrCreateGameState(store: StoreShape, ownerId: string): OwnerGameState {
  if (!store.gameStateByOwner[ownerId]) {
    const existingBalance = store.balancesByOwner[ownerId] ?? DEFAULT_OWNER_BALANCE;
    store.gameStateByOwner[ownerId] = defaultGameState(existingBalance);
  }
  return store.gameStateByOwner[ownerId];
}

function syncBalanceFromGameState(store: StoreShape, ownerId: string) {
  const gs = store.gameStateByOwner[ownerId];
  if (gs) store.balancesByOwner[ownerId] = gs.balance;
}

function ownerHasData(store: StoreShape, ownerId: string) {
  return (
    [...store.scenarios.values()].some((scenario) => scenario.ownerId === ownerId) ||
    [...store.sessions.values()].some((session) => session.ownerId === ownerId) ||
    store.balancesByOwner?.[ownerId] !== undefined
  );
}

function claimLegacyDataForOwner(store: StoreShape, ownerId: string) {
  let changed = false;

  for (const scenario of store.scenarios.values()) {
    if (scenario.ownerId === LEGACY_OWNER_ID) {
      scenario.ownerId = ownerId;
      changed = true;
    }
  }

  for (const session of store.sessions.values()) {
    if (session.ownerId === LEGACY_OWNER_ID) {
      session.ownerId = ownerId;
      session.scenario.ownerId = ownerId;
      changed = true;
    }
  }

  const legacyBalance = store.balancesByOwner[LEGACY_OWNER_ID];
  if (legacyBalance !== undefined) {
    store.balancesByOwner[ownerId] = legacyBalance;
    delete store.balancesByOwner[LEGACY_OWNER_ID];
    changed = true;
  }

  return changed;
}

function ensureOwnerState(store: StoreShape, ownerId: string) {
  let changed = false;

  if (!ownerHasData(store, ownerId) && ownerHasData(store, LEGACY_OWNER_ID)) {
    changed = claimLegacyDataForOwner(store, ownerId) || changed;
  }

  if (store.balancesByOwner[ownerId] === undefined) {
    store.balancesByOwner[ownerId] = DEFAULT_OWNER_BALANCE;
    changed = true;
  }

  // Ensure game state exists and is in sync with balance
  if (!store.gameStateByOwner[ownerId]) {
    store.gameStateByOwner[ownerId] = defaultGameState(store.balancesByOwner[ownerId]);
    changed = true;
  }

  return changed;
}

export function getStoreFilePath() {
  return STORE_PATH;
}

export function getUserBalance(ownerId: string): number {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);

  if (changed) {
    persistStore(store);
  }

  return store.balancesByOwner[ownerId] ?? DEFAULT_OWNER_BALANCE;
}

export function getUserStats(ownerId: string): UserStats {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);
  const gs = getOrCreateGameState(store, ownerId);

  // Sync balance in case it was modified by other paths
  gs.balance = store.balancesByOwner[ownerId] ?? gs.balance;

  if (changed) persistStore(store);

  const today = todayUTC();
  const dailyBonusAvailable = gs.dailyBonusClaimedDate !== today;
  const streakMultiplier = calcStreakMultiplier(gs.streak);

  return {
    balance:  gs.balance,
    xp:       gs.xp,
    level:    gs.level,
    streak:   gs.streak,
    lastActiveDate: gs.lastActiveDate,
    dailyBonusAvailable,
    isNewOwner: gs.isFirstLogin,
    streakMultiplier,
  };
}

// Mark owner as no longer new and grant welcome bonus for wallet users
export function markOwnerSeen(ownerId: string, isWalletOwner: boolean = false): void {
  const store = getStore();
  const gs = getOrCreateGameState(store, ownerId);
  if (gs.isFirstLogin) {
    gs.isFirstLogin = false;
    // Grant welcome bonus only for wallet connections
    if (isWalletOwner && gs.balance === 0) {
      gs.balance = WELCOME_COINS;
    }
    store.balancesByOwner[ownerId] = gs.balance;
    persistStore(store);
  }
}

export function saveScenario(ownerId: string, scenario: Scenario): Scenario {
  const store = getStore();
  ensureOwnerState(store, ownerId);
  scenario.ownerId = ownerId;
  store.scenarios.set(scenario.id, scenario as OwnedScenario);
  persistStore(store);
  return scenario;
}

export function getScenario(ownerId: string, id: string): Scenario | null {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);
  const scenario = store.scenarios.get(id);

  if (changed) {
    persistStore(store);
  }

  return scenario?.ownerId === ownerId ? scenario : null;
}

export function createSession(ownerId: string, scenario: Scenario): ReplaySession {
  const stake = 100;
  const store = getStore();
  ensureOwnerState(store, ownerId);
  const currentBalance = store.balancesByOwner[ownerId] ?? DEFAULT_OWNER_BALANCE;
  store.balancesByOwner[ownerId] = Math.max(0, currentBalance - stake);

  scenario.ownerId = ownerId;
  const session: OwnedReplaySession = {
    id: createId("session"),
    ownerId,
    scenario: scenario as Scenario,
    status: "active",
    stake,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    decisions: [],
  };
  initializeEntropyState(session);

  store.sessions.set(session.id, session);
  persistStore(store);
  return session;
}

export function getSession(ownerId: string, id: string): ReplaySession | null {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);
  const session = store.sessions.get(id);

  if (changed) {
    persistStore(store);
  }

  return session?.ownerId === ownerId ? session : null;
}

export function updateSession(ownerId: string, session: ReplaySession): ReplaySession {
  const store = getStore();
  ensureOwnerState(store, ownerId);
  session.ownerId = ownerId;
  session.scenario.ownerId = ownerId;
  store.sessions.set(session.id, session as OwnedReplaySession);
  persistStore(store);
  return session;
}

export async function armSessionEntropy(ownerId: string, sessionId: string): Promise<ReplaySession | null> {
  const session = getSession(ownerId, sessionId);

  if (!session) {
    return null;
  }

  await armEntropyForSession(session);
  updateSession(ownerId, session);
  return session;
}

export async function syncSessionEntropy(ownerId: string, sessionId: string): Promise<ReplaySession | null> {
  const session = getSession(ownerId, sessionId);

  if (!session) {
    return null;
  }

  await syncEntropyForSession(session);
  
  // RE-FETCH: Another request (e.g. recordDecision) might have modified the session 
  // while we were awaiting. Re-fetch to ensure we don't overwrite with stale data.
  const latest = getSession(ownerId, sessionId) ?? session;
  latest.entropy = session.entropy;
  latest.scenario.candles = session.scenario.candles;
  latest.scenario.shockEvent = session.scenario.shockEvent;

  updateSession(ownerId, latest);
  return latest;
}

export function recordDecision(options: {
  ownerId: string;
  sessionId: string;
  checkpointId: string;
  action: Action;
  confidence: number;
  reason: string;
  timerRemaining: number;
  actor: "human" | "agent";
}): ReplaySession | null {
  const session = getSession(options.ownerId, options.sessionId);

  if (!session) {
    return null;
  }

  const checkpoint = session.scenario.checkpoints.find(
    (item) => item.id === options.checkpointId,
  );

  if (!checkpoint) {
    return session;
  }

  const existing = session.decisions.find(
    (item) => item.checkpointId === options.checkpointId,
  );

  if (existing) {
    return session;
  }

  const stats = scoreDecision(
    {
      action: options.action,
      timerRemaining: options.timerRemaining,
      confidence: options.confidence,
    },
    checkpoint,
    session.scenario.riskRules,
    session.scenario,
  );

  session.decisions.push({
    id: createId("decision"),
    checkpointId: checkpoint.id,
    candleIndex: checkpoint.candleIndex,
    action: options.action,
    confidence: options.confidence,
    reason: options.reason,
    timerRemaining: options.timerRemaining,
    expectedBestAction: checkpoint.expectedBestAction,
    impactScore: stats.impactScore,
    createdAt: new Date().toISOString(),
    actor: options.actor,
  });

  updateSession(options.ownerId, session);
  return session;
}

export function finalizeSession(ownerId: string, sessionId: string): ReplaySession | null {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);
  const session = store.sessions.get(sessionId);

  if (changed) {
    persistStore(store);
  }

  if (!session || session.ownerId !== ownerId || session.status === "complete") {
    return session ?? null;
  }

  const score = scoreSession(session);
  const aiReport = generateAiReport(session, score);

  // ── Credit reward with streak multiplier ──────────────────
  const gs = getOrCreateGameState(store, ownerId);
  const baseReward = Math.round(score.total * XP_PER_POINT);
  const streak_mult = calcStreakMultiplier(gs.streak > 0 ? gs.streak : 1);
  const creditReward = Math.round(baseReward * streak_mult);

  // ── XP + level up ──────────────────────────────────────────
  const xpEarned = Math.round(score.total * XP_PER_POINT);

  // ── Daily bonus (first session each calendar day) ──────────
  const today = todayUTC();
  let dailyBonusXp    = 0;
  let dailyBonusCoins = 0;
  if (gs.dailyBonusClaimedDate !== today) {
    dailyBonusXp    = DAILY_BONUS_XP;
    dailyBonusCoins = DAILY_BONUS_COINS;
    gs.dailyBonusClaimedDate = today;
  }

  // ── Streak logic ───────────────────────────────────────────
  if (gs.lastActiveDate === null) {
    gs.streak = 1;
  } else {
    const last  = new Date(gs.lastActiveDate);
    const now   = new Date(today);
    const diffMs = now.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      gs.streak += 1;               // continued streak
    } else if (diffDays > 1) {
      gs.streak = 1;               // reset streak
    }
    // diffDays === 0 means same day, streak unchanged
  }
  gs.lastActiveDate = today;

  // ── Apply rewards ──────────────────────────────────────────
  gs.balance += creditReward + dailyBonusCoins;
  gs.xp      += xpEarned + dailyBonusXp;
  gs.level    = xpToLevel(gs.xp);

  // Keep legacy balance map in sync
  store.balancesByOwner[ownerId] = gs.balance;

  session.score      = score;
  session.aiReport   = aiReport;
  session.reward     = creditReward;
  session.status     = "complete";
  session.completedAt = new Date().toISOString();

  updateSession(ownerId, session);
  return session;
}

function sessionToHistoryEntry(session: ReplaySession): HistoryEntry {
  const total = session.score?.total ?? 0;

  return {
    id: session.id,
    assetLabel: session.scenario.asset.label,
    scenarioLabel: session.scenario.scenarioType.replace("-", " "),
    modeLabel: session.scenario.mode === "agent" ? "Agent" : "Human",
    total,
    grade: session.score?.grade ?? "Unscored",
    completedAtLabel: formatTimestampLabel(
      new Date(session.completedAt ?? session.startedAt).getTime(),
    ),
    changePct: session.scenario.summary.changePct,
    summary:
      session.aiReport?.summary ??
      `Completed ${session.scenario.scenarioType} drill with ${session.decisions.length} decisions.`,
    href: session.score ? `/report/${session.id}` : undefined,
  };
}

export function getHistoryEntries(ownerId: string): HistoryEntry[] {
  const store = getStore();
  const changed = ensureOwnerState(store, ownerId);

  const liveEntries = [...store.sessions.values()]
    .filter((session) => session.ownerId === ownerId && session.status === "complete" && session.score)
    .sort((left, right) => {
      const leftTime = new Date(left.completedAt ?? left.startedAt).getTime();
      const rightTime = new Date(right.completedAt ?? right.startedAt).getTime();
      return rightTime - leftTime;
    })
    .map(sessionToHistoryEntry);

  if (changed) {
    persistStore(store);
  }

  return [...liveEntries, ...SEEDED_HISTORY];
}

export function getLeaderboardEntries(ownerId: string): HistoryEntry[] {
  return getHistoryEntries(ownerId)
    .slice()
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);
}

const DAILY_REWARDS: Record<number, number> = {
  1: 100,
  2: 150,
  3: 200,
  4: 250,
  5: 300,
  6: 350,
  7: 500,
};

export function claimDailyStreak(ownerId: string, day: number): { success: boolean; error?: string; newBalance?: number; streak?: number; coinsEarned?: number } {
  const store = getStore();
  ensureOwnerState(store, ownerId);
  const gs = getOrCreateGameState(store, ownerId);

  if (day < 1 || day > 7) {
    return { success: false, error: "Invalid day" };
  }

  const today = todayUTC();

  // Check if already claimed today
  if (gs.lastStreakClaimDate === today) {
    return { success: false, error: "You already claimed your streak today! Come back tomorrow." };
  }

  // Check if claiming the correct next day
  if (day !== gs.streak + 1) {
    return { success: false, error: `You must claim Day ${gs.streak + 1} next!` };
  }

  const coinsEarned = DAILY_REWARDS[day];

  // Add coins
  gs.balance += coinsEarned;

  // Update streak
  gs.streak = day;
  
  // If completed all 7 days, reset to 0 so they can start over tomorrow
  if (day === 7) {
    gs.streak = 0;
  }

  // Mark today as claimed
  gs.lastStreakClaimDate = today;
  gs.lastActiveDate = today;

  // Sync balance
  store.balancesByOwner[ownerId] = gs.balance;
  persistStore(store);

  return {
    success: true,
    newBalance: gs.balance,
    streak: gs.streak,
    coinsEarned,
  };
}
