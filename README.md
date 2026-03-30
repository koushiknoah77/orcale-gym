<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24,20,17,14,11&height=300&section=header&text=Oracle%20Gym&fontSize=90&fontAlignY=38&animation=twinkling&fontColor=ffffff&desc=Gamified%20Trading%20Arena%20%C2%B7%20Powered%20by%20Pyth%20Network&descAlignY=60&descSize=22" width="100%"/>

<br>

<p>
<img src="https://img.shields.io/badge/Pyth_Network-Price_Feeds-6D28D9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiAxMkwxMiAyMkwyMiAxMkwxMiAyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+&logoColor=white&labelColor=1a1a2e" />
<img src="https://img.shields.io/badge/Entropy_V2-Verifiable_Randomness-AAFF00?style=for-the-badge&logoColor=white&labelColor=1a1a2e" />
<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white&labelColor=1a1a2e" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e" />
<img src="https://img.shields.io/badge/License-Apache_2.0-0EA5E9?style=for-the-badge&logoColor=white&labelColor=1a1a2e" />
</p>

<p>
<img src="https://img.shields.io/badge/Assets-13-6D28D9?style=flat-square&labelColor=0f0f23" />
<img src="https://img.shields.io/badge/Scenarios-6-AAFF00?style=flat-square&labelColor=0f0f23" />
<img src="https://img.shields.io/badge/Difficulty_Levels-3-FF4D6A?style=flat-square&labelColor=0f0f23" />
<img src="https://img.shields.io/badge/Streak_System-7_Days-FFBB00?style=flat-square&labelColor=0f0f23" />
<img src="https://img.shields.io/badge/Wallet_Support-300+-059669?style=flat-square&labelColor=0f0f23" />
</p>

<h3>🎮 Train Your Trading Skills in a Gamified Arena</h3>
<p><i>Replay real markets · Survive entropy shocks · Earn XP · Level up your instincts</i></p>

<p>
<a href="#-quick-start"><img src="https://img.shields.io/badge/🚀_Quick_Start-Get_Started-6D28D9?style=for-the-badge" /></a>
<a href="#-how-to-play"><img src="https://img.shields.io/badge/🎯_How_to_Play-Learn_More-AAFF00?style=for-the-badge" /></a>
<a href="#-tech-stack"><img src="https://img.shields.io/badge/⚡_Tech_Stack-View_Details-0EA5E9?style=for-the-badge" /></a>
</p>

</div>

---

## 📑 Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | [What is Oracle Gym?](#-what-is-oracle-gym) | Overview and core concept |
| 2 | [Architecture](#-architecture) | System flow and components |
| 3 | [Features](#-features) | Complete feature breakdown |
| 4 | [Quick Start](#-quick-start) | Installation and setup |
| 5 | [How to Play](#-how-to-play) | Gameplay guide |
| 6 | [Supported Assets](#-supported-assets) | All 13 crypto assets |
| 7 | [API Endpoints](#-api-endpoints) | Backend API reference |
| 8 | [Tech Stack](#-tech-stack) | Technologies used |
| 9 | [Deployment](#-deployment) | Deploy to production |
| 10 | [Contributing](#-contributing) | How to contribute |

---

## 🤖 What is Oracle Gym?

<div align="center">

### Oracle Gym is a **gamified crypto trading training platform** where you replay real markets and level up your skills.

#### It doesn't simulate. It replays actual Pyth price feeds.

<br>

<table width="85%">
<tr>
<td align="center" width="50%">

<img src="https://img.shields.io/badge/Traditional_Platforms-Paper_Trading-E11D48?style=for-the-badge&labelColor=1a1a2e" />

```diff
- Fake prices with no real market context
- No consequences for bad decisions
- Boring, repetitive practice
- No progression or rewards
```

</td>
<td align="center" width="50%">

<img src="https://img.shields.io/badge/Oracle_Gym-Real_Market_Replay-059669?style=for-the-badge&labelColor=1a1a2e" />

```diff
+ Real Pyth price feeds from 13 assets
+ Entropy V2 random shock events
+ XP, levels, streaks, and rewards
+ AI-powered coaching and scoring
```

</td>
</tr>
</table>

</div>

<br>

### Core Principle

> **"Train like it's real. Learn from actual market conditions. Level up with every session."**

Oracle Gym uses live Pyth Network data to create realistic training scenarios. Every candle, every price tick, every volatility spike comes from real market history. Add Pyth Entropy V2 for unpredictable shock events, and you get a training ground that feels like the real thing.

<br>

### What Makes It Different

| Feature | Oracle Gym | Traditional Platforms |
|---------|-----------|----------------------|
| **Data Source** | Real Pyth price feeds | Simulated/fake data |
| **Randomness** | Pyth Entropy V2 (on-chain) | Pseudo-random |
| **Progression** | XP, levels, streaks | None |
| **Feedback** | AI coaching reports | Basic P&L |
| **Assets** | 13 major cryptos | Limited selection |
| **Cost** | Free (testnet) | Often paid |

---

## 🏗️ Architecture

<div align="center">

### Game Flow — From Connection to Completion

<sub>Built with Next.js 15 · Powered by Pyth Network · Deployed on Base Sepolia</sub>

<br>

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1a1a2e', 'primaryTextColor': '#e2e8f0', 'primaryBorderColor': '#6D28D9', 'lineColor': '#AAFF00', 'secondaryColor': '#0f0f23'}}}%%
flowchart TB
    A([User Connects Wallet]):::start --> B[Receive 1000 Coins]
    B --> C{Choose Game Mode}
    
    C -->|Train| D[Select Asset]
    C -->|History| E[View Past Sessions]
    C -->|Rankings| F[Check Leaderboard]
    
    D --> G[Pick Scenario Type]
    G --> H[Set Difficulty]
    H --> I[Configure Risk Rules]
    I --> J[Fetch Pyth Historical Data]
    
    J --> K[Start Replay Session]
    K --> L{Decision Checkpoint?}
    
    L -->|Yes| M[Make Trading Decision]
    L -->|No| N[Watch Next Candle]
    
    M --> O{Entropy Shock?}
    N --> O
    
    O -->|Yes| P[Pyth Entropy V2 Triggered]
    O -->|No| Q{Session Complete?}
    
    P --> R[Random Market Event]
    R --> Q
    
    Q -->|No| L
    Q -->|Yes| S[Calculate Score]
    
    S --> T[Generate AI Report]
    T --> U[Award XP & Coins]
    U --> V{Level Up?}
    
    V -->|Yes| W[🎉 Level Up Banner]
    V -->|No| X[Update Stats]
    
    W --> X
    X --> Y{Daily Streak?}
    
    Y -->|Yes| Z[Claim Streak Reward]
    Y -->|No| AA([Session Complete])
    
    Z --> AA
    
    classDef start fill:#6D28D9,stroke:#AAFF00,color:#fff,stroke-width:2px
    classDef done fill:#059669,stroke:#34D399,color:#fff,stroke-width:2px
```

</div>

---

## ✨ Features

<div align="center">

### Every Drill is a Battle

</div>

<table width="100%">
<tr>
<td width="50%" valign="top">

### 🎯 Core Gameplay

<img src="https://img.shields.io/badge/Real_Market_Replay-6D28D9?style=flat-square" />

Replay actual Pyth price feeds from 13+ crypto assets. Every candle is real market data.

<img src="https://img.shields.io/badge/Decision_Checkpoints-AAFF00?style=flat-square" />

Make critical trading decisions at key market moments. Buy, sell, hold, reduce, wait, or hedge.

<img src="https://img.shields.io/badge/Entropy_Shocks-FF4D6A?style=flat-square" />

Survive random market disruptions powered by Pyth Entropy V2 on-chain randomness.

<img src="https://img.shields.io/badge/AI_Coaching-0EA5E9?style=flat-square" />

Get personalized feedback and scoring after each session with detailed performance analysis.

</td>
<td width="50%" valign="top">

### 🏆 Gamification System

<img src="https://img.shields.io/badge/XP_&_Leveling-6D28D9?style=flat-square" />

Earn experience points and level up. 500 XP per level with unlimited progression.

<img src="https://img.shields.io/badge/Daily_Streaks-FFBB00?style=flat-square" />

Claim rewards for 7 consecutive days with multipliers from ×2 to ×14.

<img src="https://img.shields.io/badge/Coin_Economy-AAFF00?style=flat-square" />

Earn and spend coins on game sessions and streak boosts. Start with 1,000 coins.

<img src="https://img.shields.io/badge/Leaderboards-FF4D6A?style=flat-square" />

Compete with other traders on the rankings. Track your progress and climb the ladder.

</td>
</tr>
</table>

<br>

<details>
<summary><b>📊 Live Market Data (Click to expand)</b></summary>

<br>

| Feature | Details |
|---------|---------|
| **Assets** | 13 major cryptocurrencies (BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, POL, LINK, UNI, ATOM, PYTH) |
| **Real-time Prices** | Live ticker with 30-second updates via Pyth Hermes API |
| **Pyth Pro Integration** | Enhanced rate limits (1,000+ req/min) with Pro API token |
| **Official Icons** | Crypto logos from CoinGecko CDN for professional UI |
| **Data Fields** | Price, expo, publish_time, conf (confidence interval) |
| **Update Frequency** | 30s for live ticker, 15min candles for replay |

</details>

<details>
<summary><b>🎲 Pyth Entropy V2 Integration (Click to expand)</b></summary>

<br>

| Component | Implementation |
|-----------|----------------|
| **Verifiable Randomness** | Boss fight shock events using on-chain entropy |
| **Smart Contract** | Deployed consumer contract on Base Sepolia |
| **Contract Address** | `0x148123bc5b719a7e169ee652a72be387c964b6f4` |
| **Execution Tracking** | Monitor gas usage and callback status |
| **Explorer Integration** | View entropy requests on Pyth Explorer |
| **Callback Gas Limit** | 180,000 gas for reliable execution |

</details>

<details>
<summary><b>🎮 Scenario Types (Click to expand)</b></summary>

<br>

| Scenario | Pacing | Description |
|----------|--------|-------------|
| **Breakout** | Momentum | Trend compression snaps into expansion. Enter conviction without chasing noise. |
| **Crash** | Defensive | Violent downside unwind punishes hesitation and overconfidence. |
| **Chop** | Patience | Whipsaw price action punishes overtrading and rewards restraint. |
| **Fakeout** | Trap-heavy | Momentum looks clean until the floor disappears. Read the trap first. |
| **Slow Bleed** | Grinding | Long, draining descent tests discipline more than reflexes. |
| **Volatility Spike** | Chaos | Wide candles and sharp reversals make risk framing critical. |

</details>

<details>
<summary><b>⚡ Difficulty Levels (Click to expand)</b></summary>

<br>

| Level | Description | Characteristics |
|-------|-------------|-----------------|
| **Easy** | Cleaner structure and visible setups | Clear patterns, predictable movements |
| **Medium** | Balanced uncertainty and one meaningful shock | Mixed signals, moderate complexity |
| **Chaos** | Hidden shock, faster tape, thinner confidence | Unpredictable, high-speed decisions |

</details>

---

## 🚀 Quick Start

### Prerequisites

```bash
✅ Node.js 18+ and npm
✅ MetaMask or compatible Web3 wallet
✅ Base Sepolia testnet ETH (for entropy features)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/koushiknoah77/orcale-gym.git
cd pyth-oracle-gym

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Create a `.env.local` file with the following:

```bash
# Pyth Network APIs
PYTH_HISTORY_BASE_URL=https://history.pyth-lazer.dourolabs.app/v1
PYTH_HERMES_BASE_URL=https://hermes.pyth.network
PYTH_PRO_ACCESS_TOKEN=your_pyth_pro_token_here

# Pyth Entropy V2 (Base Sepolia)
ENTROPY_RPC_URL=https://sepolia.base.org
ENTROPY_CONSUMER_ADDRESS=0x148123bc5b719a7e169ee652a72be387c964b6f4
ENTROPY_REQUESTER_PRIVATE_KEY=your_private_key_here
ENTROPY_CHAIN_ID=84532
ENTROPY_CALLBACK_GAS_LIMIT=180000

# Optional
ORACLE_GYM_STORE_PATH=.data/oracle-gym-store.json
NEXT_PUBLIC_GYM_SEASON_ID=season-1
```

<details>
<summary><b>🔑 Getting API Keys (Click to expand)</b></summary>

<br>

1. **Pyth Pro Token**: Sign up at [pyth.network](https://pyth.network) for enhanced rate limits (1,000+ req/min)
2. **Entropy Setup**: Deploy the included smart contract or use the provided testnet address
3. **Base Sepolia ETH**: Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

</details>

---

## 🎮 How to Play

<div align="center">

### Three Rounds to Victory

<sub>Connect · Train · Dominate</sub>

</div>

<br>

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

### 🔗 Round 1
### Connect Wallet

<img src="https://img.shields.io/badge/Step-1-6D28D9?style=for-the-badge" />

<br>

1. Click **"Connect"** in top nav
2. Choose your wallet (300+ supported)
3. Switch to **Base Sepolia** network
4. Receive **1,000 coins** on first connection

<br>

<img src="https://img.shields.io/badge/Wallets-MetaMask_·_Coinbase_·_WalletConnect-059669?style=flat-square" />

</td>
<td width="33%" align="center" valign="top">

### ⚔️ Round 2
### Enter Arena

<img src="https://img.shields.io/badge/Step-2-AAFF00?style=for-the-badge" />

<br>

1. Click **"ENTER ARENA"** or **"Train"** tab
2. Select asset (BTC, ETH, SOL, etc.)
3. Choose scenario type (breakout, crash, etc.)
4. Pick difficulty and risk rules
5. Start replay session

<br>

<img src="https://img.shields.io/badge/Cost-50_Coins_per_Session-FF4D6A?style=flat-square" />

</td>
<td width="33%" align="center" valign="top">

### 🏆 Round 3
### Claim Victory

<img src="https://img.shields.io/badge/Step-3-0EA5E9?style=for-the-badge" />

<br>

1. Make decisions at checkpoints
2. Survive entropy shock event
3. Complete session
4. Review AI coaching report
5. Earn **XP, coins, and level up**

<br>

<img src="https://img.shields.io/badge/Rewards-XP_·_Coins_·_Streak_Multipliers-FFBB00?style=flat-square" />

</td>
</tr>
</table>

<br>

### 🎯 Decision Actions

At each checkpoint, choose your action:

| Action | Icon | Description | When to Use |
|--------|------|-------------|-------------|
| **Buy** | 🟢 | Enter long position | Bullish setup, strong momentum |
| **Sell** | 🔴 | Exit or short | Bearish signal, risk off |
| **Hold** | ⏸️ | Maintain position | Trend continuation, no clear signal |
| **Reduce** | 📉 | Decrease exposure | Take profits, manage risk |
| **Wait** | ⏳ | Skip checkpoint | Unclear setup, patience |
| **Hedge** | 🛡️ | Protect position | High uncertainty, defensive |

<br>

### 🔥 Daily Streak System

<div align="center">

<img src="https://img.shields.io/badge/Streak_Calendar-7_Days-FFBB00?style=for-the-badge" />

</div>

Claim rewards for consecutive days. Must claim in sequential order.

| Day | Reward | Multiplier | Total Potential |
|-----|--------|------------|-----------------|
| Day 1 | 100 coins | ×2 | 200 coins |
| Day 2 | 150 coins | ×4 | 600 coins |
| Day 3 | 200 coins | ×6 | 1,200 coins |
| Day 4 | 250 coins | ×8 | 2,000 coins |
| Day 5 | 300 coins | ×10 | 3,000 coins |
| Day 6 | 350 coins | ×12 | 4,200 coins |
| Day 7 | 500 coins | ×14 | 7,000 coins |

After Day 7, streak resets to 0 for next cycle. Multipliers apply to session earnings.

---

## 📊 Supported Assets

<div align="center">

### 13 Major Cryptocurrencies with Real Pyth Price Feeds

</div>

<br>

<table width="100%">
<tr>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/BTC-Bitcoin-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white" />

**Bitcoin / USD**

Base: $72,250

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/ETH-Ethereum-627EEA?style=for-the-badge&logo=ethereum&logoColor=white" />

**Ethereum / USD**

Base: $3,975

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/SOL-Solana-14F195?style=for-the-badge&logo=solana&logoColor=white" />

**Solana / USD**

Base: $176

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/BNB-Binance-F3BA2F?style=for-the-badge&logo=binance&logoColor=white" />

**BNB / USD**

Base: $635

</td>
</tr>
<tr>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/XRP-Ripple-23292F?style=for-the-badge&logo=xrp&logoColor=white" />

**Ripple / USD**

Base: $2.45

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/ADA-Cardano-0033AD?style=for-the-badge&logo=cardano&logoColor=white" />

**Cardano / USD**

Base: $0.98

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/DOGE-Dogecoin-C2A633?style=for-the-badge&logo=dogecoin&logoColor=white" />

**Dogecoin / USD**

Base: $0.32

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/AVAX-Avalanche-E84142?style=for-the-badge&logo=avalanche&logoColor=white" />

**Avalanche / USD**

Base: $42

</td>
</tr>
<tr>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/POL-Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white" />

**Polygon / USD**

Base: $0.52

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/LINK-Chainlink-375BD2?style=for-the-badge&logo=chainlink&logoColor=white" />

**Chainlink / USD**

Base: $22

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/UNI-Uniswap-FF007A?style=for-the-badge&logo=uniswap&logoColor=white" />

**Uniswap / USD**

Base: $13

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/ATOM-Cosmos-2E3148?style=for-the-badge&logo=cosmos&logoColor=white" />

**Cosmos / USD**

Base: $9.5

</td>
</tr>
<tr>
<td width="25%" align="center" colspan="4">

<img src="https://img.shields.io/badge/PYTH-Pyth_Network-6D28D9?style=for-the-badge&logoColor=white" />

**Pyth Network / USD**

Base: $0.71

</td>
</tr>
</table>

<details>
<summary><b>📋 Complete Asset Details (Click to expand)</b></summary>

<br>

| Symbol | Name | Pyth Feed ID | Exponent |
|--------|------|--------------|----------|
| BTC | Bitcoin | `e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` | -8 |
| ETH | Ethereum | `ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` | -8 |
| SOL | Solana | `ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` | -8 |
| BNB | BNB | `2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f` | -8 |
| XRP | Ripple | `ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8` | -8 |
| ADA | Cardano | `2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d` | -8 |
| DOGE | Dogecoin | `dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c` | -8 |
| AVAX | Avalanche | `93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7` | -8 |
| POL | Polygon | `ffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472` | -8 |
| LINK | Chainlink | `8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221` | -8 |
| UNI | Uniswap | `78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501` | -8 |
| ATOM | Cosmos | `b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819` | -8 |
| PYTH | Pyth Network | `0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff` | -8 |

</details>

---

## 🔌 API Endpoints

<div align="center">

### RESTful API for Game State and Market Data

</div>

<br>

<table width="100%">
<tr>
<td width="50%" valign="top">

### 📡 Public APIs

<img src="https://img.shields.io/badge/GET-/api/symbols-0EA5E9?style=flat-square" />

List available crypto assets with Pyth feed IDs

<img src="https://img.shields.io/badge/GET-/api/live-0EA5E9?style=flat-square" />

Real-time price snapshots for all assets

<img src="https://img.shields.io/badge/GET-/api/status-0EA5E9?style=flat-square" />

System health check and API status

<img src="https://img.shields.io/badge/GET-/api/user--stats-0EA5E9?style=flat-square" />

User XP, level, streak, balance

<img src="https://img.shields.io/badge/GET-/api/history-0EA5E9?style=flat-square" />

Session history with scores

<img src="https://img.shields.io/badge/GET-/api/leaderboard-0EA5E9?style=flat-square" />

Top scores and rankings

</td>
<td width="50%" valign="top">

### 🎮 Game Session APIs

<img src="https://img.shields.io/badge/POST-/api/scenarios-059669?style=flat-square" />

Create new scenario configuration

<img src="https://img.shields.io/badge/GET-/api/scenarios/[id]-0EA5E9?style=flat-square" />

Get scenario details by ID

<img src="https://img.shields.io/badge/POST-/api/sessions-059669?style=flat-square" />

Start new game session

<img src="https://img.shields.io/badge/GET-/api/sessions/[id]-0EA5E9?style=flat-square" />

Get session state and progress

<img src="https://img.shields.io/badge/POST-/api/sessions/[id]/decision-059669?style=flat-square" />

Record trading decision

<img src="https://img.shields.io/badge/POST-/api/sessions/[id]/entropy-059669?style=flat-square" />

Request Pyth Entropy V2 shock

<img src="https://img.shields.io/badge/POST-/api/sessions/[id]/score-059669?style=flat-square" />

Finalize and calculate score

<img src="https://img.shields.io/badge/GET-/api/sessions/[id]/report-0EA5E9?style=flat-square" />

Get AI coaching report

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔥 Streak System APIs

<img src="https://img.shields.io/badge/POST-/api/streak--claim-059669?style=flat-square" />

Claim daily streak reward

<img src="https://img.shields.io/badge/GET-/api/balance-0EA5E9?style=flat-square" />

Get current coin balance

<img src="https://img.shields.io/badge/POST-/api/mark--seen-059669?style=flat-square" />

Mark wallet as seen (welcome bonus)

</td>
<td width="50%" valign="top">

### 🔍 Internal APIs

<img src="https://img.shields.io/badge/POST-/api/internal/pyth/fetch--latest-6D28D9?style=flat-square" />

Fetch latest Pyth prices

<img src="https://img.shields.io/badge/POST-/api/internal/pyth/fetch--historical-6D28D9?style=flat-square" />

Fetch historical Pyth data

<img src="https://img.shields.io/badge/POST-/api/internal/score/evaluate-6D28D9?style=flat-square" />

Evaluate session performance

<img src="https://img.shields.io/badge/POST-/api/internal/ai/explain-6D28D9?style=flat-square" />

Generate AI coaching feedback

</td>
</tr>
</table>

---

## ⚡ Tech Stack

<div align="center">

### Built with Modern Web3 Technologies

</div>

<br>

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

### 🎨 Frontend

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" />

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />

<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />

<img src="https://img.shields.io/badge/Framer_Motion-12-FF0055?style=for-the-badge&logo=framer&logoColor=white" />

<img src="https://img.shields.io/badge/Recharts-3-8884D8?style=for-the-badge" />

<img src="https://img.shields.io/badge/Lucide_Icons-1.6-F56565?style=for-the-badge" />

</td>
<td width="33%" align="center" valign="top">

### ⛓️ Blockchain

<img src="https://img.shields.io/badge/Wagmi-3-000000?style=for-the-badge" />

<img src="https://img.shields.io/badge/Viem-2-646CFF?style=for-the-badge" />

<img src="https://img.shields.io/badge/Ethers.js-6-2535A0?style=for-the-badge" />

<img src="https://img.shields.io/badge/WalletConnect-2-3B99FC?style=for-the-badge&logo=walletconnect&logoColor=white" />

<img src="https://img.shields.io/badge/Base_Sepolia-Testnet-0052FF?style=for-the-badge" />

<img src="https://img.shields.io/badge/300+_Wallets-Supported-059669?style=for-the-badge" />

</td>
<td width="33%" align="center" valign="top">

### 🔮 Pyth Network

<img src="https://img.shields.io/badge/Pyth_Hermes-Real--time-6D28D9?style=for-the-badge" />

<img src="https://img.shields.io/badge/Pyth_History-Historical-6D28D9?style=for-the-badge" />

<img src="https://img.shields.io/badge/Pyth_Pro-Enhanced_Limits-6D28D9?style=for-the-badge" />

<img src="https://img.shields.io/badge/Entropy_V2-Randomness-AAFF00?style=for-the-badge" />

<img src="https://img.shields.io/badge/13_Assets-Live_Feeds-FF4D6A?style=for-the-badge" />

<img src="https://img.shields.io/badge/Smart_Contract-Deployed-0EA5E9?style=for-the-badge" />

</td>
</tr>
</table>

<br>

<details>
<summary><b>📦 Complete Dependencies (Click to expand)</b></summary>

<br>

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-tabs": "^1.1.13",
    "@reown/appkit": "^1.8.19",
    "@reown/appkit-adapter-wagmi": "^1.8.19",
    "@tanstack/react-query": "^5.95.2",
    "ethers": "^6.15.0",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.6.0",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-confetti": "^6.4.0",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1",
    "viem": "^2.47.6",
    "wagmi": "^3.6.0"
  }
}
```

</details>

---

## 📁 Project Structure

```
pyth-oracle-gym/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                     # API routes
│   │   │   ├── balance/            # Coin balance
│   │   │   ├── history/            # Session history
│   │   │   ├── leaderboard/        # Rankings
│   │   │   ├── live/               # Real-time prices
│   │   │   ├── scenarios/          # Scenario management
│   │   │   ├── sessions/           # Game sessions
│   │   │   ├── streak-claim/       # Streak rewards
│   │   │   ├── symbols/            # Asset list
│   │   │   └── user-stats/         # User stats
│   │   ├── gym/                    # Training mode page
│   │   ├── history/                # Session history page
│   │   ├── replay/[sessionId]/     # Replay viewer
│   │   ├── report/[sessionId]/     # Session report
│   │   ├── settings/               # Settings page
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   ├── components/                  # React components
│   │   ├── candlestick-chart.tsx   # Price chart
│   │   ├── live-market-strip.tsx   # Market ticker
│   │   ├── live-ticker-bar.tsx     # Top ticker
│   │   ├── oracle-nav.tsx          # Navigation bar
│   │   ├── orderbook.tsx           # Order book display
│   │   ├── replay-lab.tsx          # Replay interface
│   │   ├── report-view.tsx         # Session report
│   │   ├── reward-popup.tsx        # Reward notifications
│   │   ├── scenario-studio.tsx     # Scenario builder
│   │   ├── streak-shop.tsx         # Streak calendar
│   │   ├── wallet-connect-provider.tsx  # Wallet provider
│   │   ├── wallet-gate.tsx         # Wallet gate
│   │   ├── wallet-selector-modal.tsx    # Wallet selector
│   │   └── welcome-modal.tsx       # Welcome screen
│   ├── lib/                         # Core logic
│   │   ├── constants.ts            # Asset definitions
│   │   ├── entropy.ts              # Entropy V2 integration
│   │   ├── oracle-engine.ts        # Scoring & AI coaching
│   │   ├── oracle-store.ts         # Game state management
│   │   ├── ownership.ts            # User ownership
│   │   ├── pyth.ts                 # Pyth API integration
│   │   ├── types.ts                # TypeScript types
│   │   └── wagmi-config.ts         # Wagmi configuration
│   └── contracts/                   # Smart contracts
│       └── OracleGymEntropyConsumer.sol
├── public/                          # Static assets
├── .data/                           # Local storage (gitignored)
├── .env.local                       # Environment variables
├── .gitignore                       # Git ignore rules
├── GAMIFICATION_SYSTEM.md           # Game mechanics docs
├── HACKATHON_SUBMISSION.md          # Submission template
├── LICENSE                          # Apache 2.0 license
├── next.config.ts                   # Next.js config
├── package.json                     # Dependencies
├── README.md                        # This file
└── tsconfig.json                    # TypeScript config
```

---

## 🚢 Deployment

<div align="center">

### Deploy to Production in Minutes

</div>

<br>

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

### <img src="https://img.shields.io/badge/Vercel-Recommended-black?style=flat-square&logo=vercel" />

```bash
# Push to GitHub
git push origin main

# Import in Vercel
# Add environment variables
# Deploy!
```

Or use Vercel CLI:

```bash
npm install -g vercel
vercel
```

</td>
<td width="33%" align="center" valign="top">

### <img src="https://img.shields.io/badge/Netlify-Alternative-00C7B7?style=flat-square&logo=netlify" />

```bash
# Build command
npm run build

# Publish directory
.next
```

Add environment variables in Netlify dashboard.

</td>
<td width="33%" align="center" valign="top">

### <img src="https://img.shields.io/badge/Self--Hosted-VPS/Cloud-FF6B6B?style=flat-square" />

```bash
# Build for production
npm run build

# Start server
npm start

# Or use PM2
pm2 start npm --name "oracle-gym" -- start
```

</td>
</tr>
</table>

---

## 🎯 Hackathon Submission

<div align="center">

<img src="https://img.shields.io/badge/Built_for-Pyth_Community_Hackathon-6D28D9?style=for-the-badge" />

### This project demonstrates comprehensive Pyth Network integration

</div>

<br>

| Category | Implementation | Status |
|----------|----------------|--------|
| **Pyth Price Feeds** | Real-time and historical price data for 13 assets | ✅ Complete |
| **Pyth Entropy V2** | Verifiable on-chain randomness with deployed contract | ✅ Complete |
| **Pyth Pro API** | Enhanced rate limits (1,000+ req/min) | ✅ Complete |
| **Smart Contract** | Custom entropy consumer on Base Sepolia | ✅ Deployed |
| **Gamification** | XP, levels, streaks, rewards system | ✅ Complete |
| **Production Ready** | Deployable, scalable, documented | ✅ Complete |

<br>

<details>
<summary><b>📋 Submission Checklist (Click to expand)</b></summary>

<br>

- [x] Real Pyth price feeds integration
- [x] Pyth Entropy V2 smart contract deployed
- [x] 13 supported crypto assets
- [x] 6 scenario types with 3 difficulty levels
- [x] Custom scoring algorithm
- [x] 7-day streak system with multipliers
- [x] Wagmi v3 wallet support (300+ wallets)
- [x] Complete documentation
- [x] Production-ready deployment
- [x] Open source (Apache 2.0)

</details>

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

<br>

<div align="center">

<img src="https://img.shields.io/badge/PRs-Welcome-059669?style=for-the-badge" />
<img src="https://img.shields.io/badge/Issues-Open-0EA5E9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Discussions-Active-6D28D9?style=for-the-badge" />

</div>

---

## 📄 License

<div align="center">

This project is licensed under the **Apache License 2.0**

See the [LICENSE](LICENSE) file for details.

<br>

<img src="https://img.shields.io/badge/License-Apache_2.0-0EA5E9?style=for-the-badge" />

</div>

---

## 📞 Support & Resources

<table width="100%">
<tr>
<td width="50%" align="center">

### 📚 Documentation

- [GAMIFICATION_SYSTEM.md](GAMIFICATION_SYSTEM.md) - Game mechanics
- [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md) - Submission details
- [Pyth Network Docs](https://docs.pyth.network) - Official docs

</td>
<td width="50%" align="center">

### 🔗 Links

- [GitHub Repository](https://github.com/koushiknoah77/orcale-gym)
- [Pyth Network](https://pyth.network)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

</td>
</tr>
</table>

---

## 🙏 Acknowledgments

<div align="center">

Special thanks to the teams and projects that made this possible:

<br>

<table width="80%">
<tr>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/Pyth_Network-6D28D9?style=for-the-badge" />

Real-time oracle data and entropy

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/Base-0052FF?style=for-the-badge" />

Sepolia testnet infrastructure

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js" />

Amazing React framework

</td>
<td width="25%" align="center">

<img src="https://img.shields.io/badge/CoinGecko-8DC647?style=for-the-badge" />

Crypto asset icons

</td>
</tr>
</table>

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24,20,17,14,11&height=150&section=footer" width="100%"/>

<br>

**Built with ❤️ for the Pyth Community Hackathon**

<br>

<img src="https://img.shields.io/badge/⭐_Star_this_repo-if_you_like_it-FFBB00?style=for-the-badge" />

<br>

<sub>© 2026 Oracle Gym · Licensed under Apache 2.0 · Powered by Pyth Network</sub>

<br>

**[⬆ Back to Top](#)**

</div>
