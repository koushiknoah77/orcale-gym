# 🎮 Gamification System

## Overview
Oracle Gym features a complete gamification system with wallet integration, XP progression, daily streaks, and a coin-based economy.

---

## 🎯 Core Features

### 1. Wallet Integration
- **Base Sepolia Network** - Required for full functionality
- **Wallet-Connected Users** - Full access to all features
- **First Connection Bonus** - 1,000 coins granted automatically
- **Session Ownership** - All progress tied to wallet address

### 2. Coin Economy
- **Starting Balance**: 1,000 coins (first connection)
- **Game Cost**: 100 coins per session
- **Earning Coins**: Score-based rewards with streak multipliers
- **Balance Display**: Always visible in top navigation

### 3. XP & Leveling System
- **XP Calculation**: Score × 2.5 per game
- **Level Up**: Every 500 XP
- **Level Display**: Badge in navigation bar
- **Progress Bar**: Visual XP progress indicator
- **Level-Up Animation**: Celebration banner on level up

### 4. Daily Streak System (7-Day Cycle)

#### Streak Mechanics
- **Manual Claiming**: Users must click to claim each day
- **Sequential Order**: Must claim Day 1, then Day 2, etc.
- **One Claim Per Day**: Date-based tracking prevents multiple claims
- **Auto-Reset**: After Day 7, resets to Day 1 for next cycle

#### Daily Rewards & Multipliers
| Day | Coins | Multiplier |
|-----|-------|------------|
| Day 1 | 100 | ×2 |
| Day 2 | 150 | ×4 |
| Day 3 | 200 | ×6 |
| Day 4 | 250 | ×8 |
| Day 5 | 300 | ×10 |
| Day 6 | 350 | ×12 |
| Day 7 | 500 | ×14 |

#### Streak UI
- **Location**: Fire icon (🔥) in top nav (left side, next to logo)
- **Display**: Shows current streak day and multiplier
- **Clickable**: Opens streak calendar modal
- **Calendar View**: 7-day grid showing claimed/locked days

### 5. Reward Calculation

#### Base Reward Formula
```
Base Coins = Score × 2.5
Streak Multiplier = Current Streak Day × 2
Final Reward = Base Coins × Streak Multiplier
```

#### Daily Bonus (First Game of Day)
- **Bonus Coins**: +100 coins
- **Bonus XP**: +50 XP
- **Tracking**: UTC date-based

#### Example Calculation
**Scenario**: User with Day 3 streak completes game with score 75

```
Base reward = 75 × 2.5 = 187.5 → 188 coins
Streak multiplier = 3 × 2 = ×6
Game reward = 188 × 6 = 1,128 coins

If first game of day:
Daily bonus = +100 coins
Total = 1,128 + 100 = 1,228 coins
```

---

## 🎨 UI Components

### Navigation Bar
- **Left Side**: Logo + Streak badge (🔥)
- **Right Side**: Coins, XP bar, Level badge, Wallet button
- **Streak Badge**: Shows current day and multiplier
- **XP Bar**: Visual progress to next level
- **Coin Display**: Current balance (only when connected)

### Streak Calendar Modal
- **7-Day Grid**: Horizontal layout of all 7 days
- **Day States**:
  - ✅ **Claimed**: Green with checkmark
  - 🔥 **Next**: Gold with glow animation
  - 🔒 **Locked**: Gray with lock icon
- **Day Info**: Shows coins and multiplier for each day
- **Claim Button**: Click to claim current day
- **Progress Bar**: Shows completion percentage

### Reward Popup (After Game)
- **Grade Badge**: S, A, B, C, D, F based on score
- **Coins Earned**: Total coins from game
- **Streak Status**: Current streak and multiplier
- **Confetti Animation**: For high scores (A or S grade)

---

## 🔄 User Flows

### First-Time User
1. Visit site → See landing page
2. Click "ENTER ARENA"
3. Connect wallet (MetaMask/compatible)
4. Switch to Base Sepolia if needed
5. Receive 1,000 coins automatically
6. Start playing!

### Daily Streak Claiming
1. Click fire icon (🔥) in navigation
2. Streak calendar modal opens
3. Click on next available day (glowing gold)
4. Receive coins and multiplier boost
5. Come back tomorrow to claim next day
6. After Day 7, cycle resets to Day 1

### Playing a Game
1. Go to "Train" tab
2. Select asset (BTC, ETH, SOL, etc.)
3. Choose scenario type and difficulty
4. Click "Enter Battle" (costs 100 coins)
5. Make decisions at checkpoints
6. Complete game and view report
7. Earn coins with streak multiplier applied

### Returning User
1. Wallet auto-connects
2. Streak continues if claimed yesterday
3. Daily bonus available if new UTC day
4. Can claim next streak day if available
5. Play games with existing balance

---

## 📊 Scoring System

### Score Components
| Component | Weight | Description |
|-----------|--------|-------------|
| **Price Alignment** | 35% | Correct market direction prediction |
| **Timing** | 25% | Execution precision at checkpoints |
| **Risk Discipline** | 20% | Following risk rules and confidence thresholds |
| **Adaptability** | 20% | Handling entropy shocks and volatility |

### Grade Thresholds
| Score | Grade | Description |
|-------|-------|-------------|
| 90-100 | S | Elite performance |
| 75-89 | A | Excellent execution |
| 60-74 | B | Good performance |
| 50-59 | C | Average performance |
| 40-49 | D | Below average |
| 0-39 | F | Poor performance |

---

## 🛠️ Technical Implementation

### Key Files
- `src/lib/oracle-store.ts` - Game state, coins, streaks, XP
- `src/components/oracle-nav.tsx` - Navigation with streak badge
- `src/components/streak-shop.tsx` - Streak calendar modal
- `src/app/api/streak-claim/route.ts` - Streak claim API
- `src/app/api/user-stats/route.ts` - User stats API
- `src/lib/ownership.ts` - Wallet session management

### State Management
- **Storage**: File-based JSON (`.data/oracle-gym-store.json`)
- **Per-Wallet Tracking**: Balance, XP, level, streak
- **Date Tracking**: UTC dates for daily bonuses and streaks
- **Session Ownership**: All data scoped by wallet address

### API Endpoints
- `GET /api/user-stats` - Get balance, XP, level, streak
- `POST /api/streak-claim` - Claim daily streak reward
- `GET /api/balance` - Get current coin balance
- `POST /api/mark-seen` - Mark wallet as seen (welcome bonus)
- `POST /api/sessions` - Create session (deducts 100 coins)
- `POST /api/sessions/[id]/score` - Finalize and award coins

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Leaderboard with global rankings
- [ ] Achievement badges system
- [ ] Coin shop for cosmetics/power-ups
- [ ] Weekly challenges with bonus rewards
- [ ] Referral system
- [ ] NFT badges for milestones
- [ ] Tournament mode
- [ ] Social features (friends, challenges)

### Potential Upgrades
- [ ] Database migration (PostgreSQL/MongoDB)
- [ ] Multi-chain support
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Custom avatar system
- [ ] Clan/team features

---

## 📈 Engagement Metrics

### Retention Mechanics
- **Daily Streaks**: Encourages daily return
- **Leveling System**: Long-term progression goal
- **Coin Economy**: Immediate reward feedback
- **Multipliers**: Incentivizes consistency

### Progression Curve
- **Early Game**: Fast leveling (Levels 1-5)
- **Mid Game**: Steady progression (Levels 6-15)
- **Late Game**: Prestige and mastery (Levels 16+)

---

**Built with ❤️ for the Pyth Community Hackathon**
