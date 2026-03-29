# 🎮 Oracle Gym - Gamified Crypto Trading Platform

> A gamified crypto learning platform powered by Pyth Network. Replay real markets, survive entropy shocks, earn XP, and level up your trading instincts.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Powered by Pyth](https://img.shields.io/badge/Powered%20by-Pyth%20Network-6D28D9)](https://pyth.network/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 🌟 Features

### 🎯 Core Gameplay
- **Real Market Replay** - Replay actual Pyth price feeds from 13+ crypto assets
- **Decision Checkpoints** - Make critical trading decisions at key market moments
- **Entropy Shocks** - Survive random market disruptions powered by Pyth Entropy V2
- **AI Coaching** - Get personalized feedback and scoring after each session

### 🏆 Gamification System
- **XP & Leveling** - Earn experience points and level up (500 XP per level)
- **Daily Streaks** - Claim rewards for 7 consecutive days with multipliers up to ×14
- **Coin Economy** - Earn and spend coins on game sessions and boosts
- **Leaderboards** - Compete with other traders on the rankings

### 📊 Live Market Data
- **13 Crypto Assets** - BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, MATIC, LINK, UNI, ATOM, PYTH
- **Real-time Prices** - Live ticker with 30-second updates via Pyth Hermes
- **Pyth Pro Integration** - Enhanced rate limits (1,000+ req/min) with Pro API token
- **Official Icons** - Crypto logos from CoinGecko CDN

### 🎲 Pyth Entropy V2 Integration
- **Verifiable Randomness** - Boss fight shock events using on-chain entropy
- **Smart Contract** - Deployed consumer contract on Base Sepolia
- **Execution Tracking** - Monitor gas usage and callback status
- **Explorer Integration** - View entropy requests on Pyth Explorer

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH (for entropy features)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pyth-oracle-gym

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Configuration

### Required Environment Variables

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
ENTROPY_CHAIN_NAME=Base Sepolia
ENTROPY_CALLBACK_GAS_LIMIT=180000
ENTROPY_EXPLORER_URL=https://entropy-explorer.pyth.network

# Optional
ORACLE_GYM_STORE_PATH=.data/oracle-gym-store.json
NEXT_PUBLIC_GYM_SEASON_ID=season-1
```

### Getting API Keys

1. **Pyth Pro Token**: Sign up at [pyth.network](https://pyth.network) for enhanced rate limits
2. **Entropy Setup**: Deploy the included smart contract or use the provided testnet address
3. **Base Sepolia ETH**: Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

---

## 📁 Project Structure

```
pyth-oracle-gym/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── gym/               # Training mode page
│   │   ├── history/           # Session history page
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── candlestick-chart.tsx
│   │   ├── live-ticker-bar.tsx
│   │   ├── oracle-nav.tsx
│   │   ├── streak-shop.tsx
│   │   └── ...
│   ├── lib/                   # Core logic
│   │   ├── pyth.ts           # Pyth API integration
│   │   ├── entropy.ts        # Entropy V2 integration
│   │   ├── oracle-store.ts   # Game state management
│   │   ├── oracle-engine.ts  # Scoring & AI coaching
│   │   └── constants.ts      # Asset definitions
│   └── contracts/            # Smart contracts
│       └── OracleGymEntropyConsumer.sol
├── public/                   # Static assets
├── .data/                    # Local storage (gitignored)
└── README.md
```

---

## 🎮 How to Play

### 1. Connect Wallet
- Click "Connect" in the top navigation
- Switch to Base Sepolia network
- Receive 1,000 coins on first connection

### 2. Start Training
- Click "ENTER ARENA" or go to "Train" tab
- Select asset (BTC, ETH, SOL, etc.)
- Choose scenario type (bull run, crash, volatility)
- Pick difficulty and risk rules

### 3. Make Decisions
- Watch the market replay candle by candle
- At checkpoints, choose your action:
  - 🟢 **Buy** - Enter long position
  - 🔴 **Sell** - Exit or short
  - ⏸️ **Hold** - Maintain position
  - 📉 **Reduce** - Decrease exposure
  - ⏳ **Wait** - Skip this checkpoint
  - 🛡️ **Hedge** - Protect position

### 4. Survive the Shock
- Random entropy event disrupts the market
- Powered by Pyth Entropy V2 on-chain randomness
- Adapt your strategy to survive

### 5. Review & Improve
- Get AI-generated coaching feedback
- See your score breakdown
- Earn XP, coins, and level up
- Claim daily streak rewards

---

## 🏗️ API Endpoints

### Public APIs
- `GET /api/symbols` - List available crypto assets
- `GET /api/live` - Real-time price snapshots
- `GET /api/status` - System health check
- `GET /api/user-stats` - User XP, level, streak, balance
- `GET /api/history` - Session history
- `GET /api/leaderboard` - Top scores

### Game Session APIs
- `POST /api/scenarios` - Create new scenario
- `GET /api/scenarios/[id]` - Get scenario details
- `POST /api/sessions` - Start game session
- `GET /api/sessions/[id]` - Get session state
- `POST /api/sessions/[id]/decision` - Record decision
- `POST /api/sessions/[id]/entropy` - Request entropy shock
- `POST /api/sessions/[id]/score` - Finalize and score
- `GET /api/sessions/[id]/report` - Get AI report

### Streak System
- `POST /api/streak-claim` - Claim daily streak reward
- `GET /api/balance` - Get coin balance
- `POST /api/mark-seen` - Mark wallet as seen (welcome bonus)

---

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Custom CSS
- **Blockchain**: Ethers.js v6
- **Data Sources**: Pyth Network (Hermes + History APIs)
- **Randomness**: Pyth Entropy V2
- **Storage**: File-based JSON (upgradeable to PostgreSQL)
- **Deployment**: Vercel-ready

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.local`
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
# Build command
npm run build

# Publish directory
.next

# Add environment variables in Netlify dashboard
```

### Self-Hosted (VPS/Cloud)

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2
npm install -g pm2
pm2 start npm --name "oracle-gym" -- start
```

---

## 🧪 Testing & Verification

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Run production build locally
npm start
```

---

## 📊 Supported Assets

| Symbol | Name | Pyth Feed ID |
|--------|------|--------------|
| BTC | Bitcoin | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH | Ethereum | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| SOL | Solana | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |
| BNB | BNB | `0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f` |
| XRP | Ripple | `0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8` |
| ADA | Cardano | `0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d` |
| DOGE | Dogecoin | `0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c` |
| AVAX | Avalanche | `0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7` |
| MATIC | Polygon | `0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52` |
| LINK | Chainlink | `0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221` |
| UNI | Uniswap | `0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501` |
| ATOM | Cosmos | `0xb00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819` |
| PYTH | Pyth Network | `0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff` |

---

## 🎯 Hackathon Submission

This project was built for the **Pyth Community Hackathon** and demonstrates:

✅ **Pyth Price Feeds** - Real-time and historical price data  
✅ **Pyth Entropy V2** - Verifiable on-chain randomness  
✅ **Pyth Pro API** - Enhanced rate limits and performance  
✅ **Smart Contract Integration** - Custom entropy consumer  
✅ **Gamification** - XP, levels, streaks, and rewards  
✅ **Production Ready** - Deployable and scalable

### Submission Category
- **Primary**: Price Feeds
- **Secondary**: Entropy (with live smart contract)

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

- **Documentation**: See `SYSTEM_STATUS_REPORT.md` for detailed system info
- **Game Mechanics**: See `GAMIFICATION_SYSTEM.md` for gameplay details
- **Submission Info**: See `HACKATHON_SUBMISSION_PACK.md` for hackathon assets

---

## 🙏 Acknowledgments

- **Pyth Network** - For providing real-time oracle data and entropy
- **Base** - For the Sepolia testnet infrastructure
- **Next.js** - For the amazing React framework
- **CoinGecko** - For crypto asset icons

---

**Built with ❤️ for the Pyth Community Hackathon**
