# Oracle Gym



**Team:**   

**Submitted:** March 29, 2026



## Answer Capsule



Oracle Gym transforms Pyth oracle data into an interactive trading training platform. Users replay historical market scenarios using real Pyth Price Feeds (price, expo, publish_time, conf) and face random "boss fight" events powered by Pyth Entropy V2. The platform features 6 scenario types, 3 difficulty tiers, and a 7-day streak system with coin multipliers (×2 to ×14). Each Pyth data point becomes part of the gameplay mechanics, turning raw oracle feeds into an engaging learning experience with performance scoring and trader archetype analysis.



## What It Does



Ever wanted to practice crypto trading without risking real money? Oracle Gym puts you in a training arena where you replay real market scenarios using actual Pyth price data. You choose from 13 crypto assets, select a scenario type (Breakout, Crash, Chop, Fakeout, Slow Bleed, Volatility Spike), and make trading decisions at checkpoints. The platform uses Pyth Entropy V2 to inject random "boss fight" shocks during gameplay, simulating real market chaos. You earn XP, level up, maintain daily streaks for coin multipliers, and compete on leaderboards. Each session is scored on timing, risk discipline, and adaptability.



## Pyth Features Used



☑️ **Price Feeds (off-chain via Hermes API)**

- `price` - Real-time and historical price data for 13 crypto assets

- `expo` - Price exponent for proper decimal handling  

- `publish_time` - Timestamp verification for historical replay accuracy

- `conf` - Confidence intervals displayed in live ticker

- Historical lookups via Hermes API for scenario generation



☑️ **Entropy V2 (on-chain)**

- Custom Solidity contract on Base Sepolia: `0x148123bc5b719a7e169ee652a72be387c964b6f4`

- Generates provably random "boss fight" events during gameplay

- Random number determines shock type, timing, and magnitude

- Entropy callback triggers in-game events



Each Pyth data point is used as actual gameplay mechanics, not just displayed. Price feeds drive candlestick charts and decision checkpoints, while Entropy creates unpredictable market shocks.



## Links



- **Live Demo:** https://orcale-gym.vercel.app/

- **Source Code:** 

- **Video Walkthrough:** [YouTube/Loom URL]



- **Smart Contract:** `0x148123bc5b719a7e169ee652a72be387c964b6f4` (Base Sepolia)





## Screenshots



[Add screenshots showing: landing page, training session with Pyth data, entropy boss fight, score report, streak calendar, leaderboard]



## Tech Stack



- **Framework:** Next.js 16.2.1 (App Router, TypeScript)

- **Styling:** Tailwind CSS v4

- **Animations:** Framer Motion + CSS Keyframes

- **Charts:** Recharts for candlestick visualization

- **Blockchain:** Wagmi v3 + Viem v2 + Ethers.js v6

- **Oracle Data:** Pyth Hermes REST API + Pyth Entropy V2

- **Wallet Support:** 300+ wallets (MetaMask, WalletConnect, Coinbase Wallet)

- **Deployment:** Vercel-ready



## How It Works (Technical)



1. User connects wallet and selects asset from 13 Pyth-supported cryptos

2. App fetches historical price data from Pyth Hermes API for scenario generation

3. Scenario engine creates 6-24 hour replay window with decision checkpoints

4. Live candlestick chart renders using actual Pyth price/expo/publish_time data

5. During gameplay, Entropy V2 contract is called to generate random boss fight

6. Random number determines shock type (flash crash, volatility spike, etc.)

7. Player makes decisions at checkpoints, scored on timing/risk/adaptability

8. Custom algorithm evaluates performance using 5 scoring dimensions

9. Trader archetype assigned based on decision patterns

10. XP/coins awarded with streak multiplier (×2 to ×14 based on daily login)



All Pyth data is fetched server-side via Next.js API routes. The app includes fallback scenarios if Pyth API is temporarily unavailable.



## Supported Assets (13 Pyth Price Feeds)



BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD, ADA/USD, DOGE/USD, AVAX/USD, POL/USD, LINK/USD, UNI/USD, ATOM/USD, PYTH/USD



Each asset uses its official Pyth Hermes ID for accurate price data.



## Content Contributions



- **Public Post (Reddit/Dev.to/Hashnode):** [URL - to be added]

- **Technical Contribution (Stack Overflow/GitHub Gist):** [URL - to be added]

- **Bonus - X Platform Post:** [URL - to be added]



## Licensing



Licensed under Apache 2.0: [LICENSE](./LICENSE)



## Eligibility Confirmation



- [x] 18+ years old

- [x] Not in OFAC-sanctioned jurisdiction

- [x] Original work created during hackathon

- [x] Agree to Terms & Conditions