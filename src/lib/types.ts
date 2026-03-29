export type ScenarioType =
  | "breakout"
  | "crash"
  | "chop"
  | "fakeout"
  | "slow-bleed"
  | "volatility-spike";

export type Difficulty = "easy" | "medium" | "chaos";
export type ReplayMode = "human" | "agent";
export type Action = "buy" | "sell" | "hold" | "reduce" | "wait" | "hedge";
export type SessionStatus = "created" | "active" | "complete";
export type DataSource = "pyth-history" | "synthetic";
export type EntropyStatus =
  | "disabled"
  | "idle"
  | "requesting"
  | "pending"
  | "fulfilled"
  | "callback-failed"
  | "tx-failed";

export type AssetOption = {
  key: string;
  label: string;
  fullSymbol: string;
  historySymbol: string;
  assetType: "crypto";
  basePrice: number;
  channel: string;
  resolution: string;
  hermesId?: string;
  pythLazerId?: number;
  description?: string;
  exponent?: number;
  state?: string;
  quoteCurrency?: string;
};

export type RiskRules = {
  maxLossPct: number;
  cooldownBars: number;
  leverageCap: number;
  patienceThreshold: number;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  confidence?: number;
  entropy?: boolean;
  checkpoint?: boolean;
};

export type ShockEvent = {
  id: string;
  candleIndex: number;
  shockType: string;
  magnitude: number;
  hidden: boolean;
  effectDescription: string;
};

export type Checkpoint = {
  id: string;
  candleIndex: number;
  title: string;
  prompt: string;
  context: string;
  expectedBestAction: Action;
  fallbackActions: Action[];
  riskNote: string;
  pressure: string;
};

export type ScenarioSummary = {
  startPrice: number;
  endPrice: number;
  changePct: number;
  volatilityPct: number;
};

export type MarketWindowContext = {
  windowStartTime: number;
  windowEndTime: number;
  channel: string;
  symbol: string;
  selectionScore: number;
  selectionReason: string;
};

export type Scenario = {
  id: string;
  ownerId?: string;
  asset: AssetOption;
  scenarioType: ScenarioType;
  difficulty: Difficulty;
  mode: ReplayMode;
  windowHours: number;
  resolution: string;
  createdAt: string;
  source: DataSource;
  seed: string;
  riskRules: RiskRules;
  candles: Candle[];
  checkpoints: Checkpoint[];
  shockEvent: ShockEvent;
  summary: ScenarioSummary;
  marketContext: MarketWindowContext;
};

export type DecisionEvent = {
  id: string;
  checkpointId: string;
  candleIndex: number;
  action: Action;
  confidence: number;
  reason: string;
  timerRemaining: number;
  expectedBestAction: Action;
  impactScore: number;
  createdAt: string;
  actor: "human" | "agent";
};

export type ScoreBreakdown = {
  decisionQuality: number;
  timingPrecision: number;
  riskDiscipline: number;
  adaptability: number;
  consistency: number;
  penalties: number;
  total: number;
  grade: string;
};

export type AiReport = {
  summary: string;
  archetype: string;
  archetypeDescription: string;
  whatWentRight: string[];
  whatWentWrong: string[];
  nextDrill: string;
  verdict: string;
};

export type EntropySessionState = {
  enabled: boolean;
  source: "pyth-entropy-v2" | "local-fallback";
  status: EntropyStatus;
  sessionKey: string;
  chainName?: string;
  chainId?: number;
  consumerAddress?: string;
  entropyAddress?: string;
  explorerUrl?: string;
  callbackGasLimit?: number;
  sequenceNumber?: string;
  requestTxHash?: string;
  revealTxHash?: string;
  requestBlockNumber?: number;
  randomNumber?: string;
  callbackFailed?: boolean;
  callbackGasUsed?: number;
  requestedAt?: string;
  resolvedAt?: string;
  error?: string;
  note?: string;
  applied?: boolean;
};

export type ReplaySession = {
  id: string;
  ownerId?: string;
  scenario: Scenario;
  status: SessionStatus;
  stake?: number;
  reward?: number;
  createdAt: string;
  startedAt: string;
  completedAt?: string;
  decisions: DecisionEvent[];
  score?: ScoreBreakdown;
  aiReport?: AiReport;
  entropy?: EntropySessionState;
};

export type ScenarioRequestInput = {
  assetKey: string;
  scenarioType: ScenarioType;
  difficulty: Difficulty;
  windowHours: number;
  mode: ReplayMode;
  riskRules: RiskRules;
};

export type StatusSnapshot = {
  historyEndpoint: string;
  hermesEndpoint: string;
  pythHistoryConfigured: boolean;
  pythProTokenConfigured: boolean;
  hermesLiveConfigured: boolean;
  liveModeEnabled: boolean;
  entropyEnabled: boolean;
  entropyChainName: string;
  entropyConsumerAddress: string;
  entropyExplorerUrl: string;
  entropyCallbackGasLimit: number;
  fallbackMode: string;
};

export type LivePriceSnapshot = {
  assetKey: string;
  symbol: string;
  price: number;
  confidence: number;
  relativeConfidencePct: number;
  exponent: number;
  publishTime: number;
  publishTimeIso: string;
  source: "hermes";
};

export type HistoryEntry = {
  id: string;
  assetLabel: string;
  scenarioLabel: string;
  modeLabel: string;
  total: number;
  grade: string;
  completedAtLabel: string;
  changePct: number;
  summary: string;
  href?: string;
};

export type UserStats = {
  balance: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  dailyBonusAvailable: boolean;
  isNewOwner: boolean;
  streakMultiplier: number;
};
