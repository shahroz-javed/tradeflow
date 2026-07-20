Build a React + Firebase trading journal and planning app called "TradeFlow" for a forex trader.

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Firebase (Firestore, Auth, Storage)
- Zustand (UI state)
- React Router v6
- Recharts (stats charts)

## Design
Dark trading terminal theme:
- Background: #0A0D12
- Panel: #12161D
- Panel-2: #1A1F28
- Border: #262C38
- Text: #E7EBF0
- Text-dim: #8B96AC
- Accent: #4D8DF7
- Long/Profit: #22C58B
- Short/Loss: #F0555F
- Warning: #F4B860
- Font: Inter (sans), JetBrains Mono (numbers/mono)

All number values must use monospace font.
Sidebar navigation. Clean, minimal. No unnecessary decoration.

---

## Firebase Setup

### Config
Read from .env:
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_ID
VITE_FIREBASE_APP_ID

### Firestore Structure
users/{userId}/
├── profile/
│   ├── displayName
│   ├── demoBalance
│   ├── liveBalance
│   ├── riskPercent (default 2)
│   └── leverage (default 500)
│
├── trades/{tradeId}/
│   ├── date
│   ├── pair (EURUSD/GBPUSD/AUDUSD/NZDUSD/USDJPY/USDCAD/USDCHF/XAUUSD/XAGUSD)
│   ├── direction (long/short)
│   ├── type (demo/live)
│   ├── entry (number)
│   ├── stopLoss (number)
│   ├── takeProfit (number)
│   ├── lotSize (number)
│   ├── riskAmount (number)
│   ├── riskPercent (number)
│   ├── plannedRR (number)
│   ├── actualRR (number)
│   ├── result (win/loss/breakeven)
│   ├── pnl (number)
│   ├── rulesFollowed (boolean)
│   ├── session (london/newyork/asian/pacific)
│   ├── whyEntered (text)
│   ├── emotions (text)
│   ├── mistakes (text)
│   ├── lessonsLearned (text)
│   ├── screenshotUrl (string)
│   └── createdAt (serverTimestamp)
│
├── levels/{pair}/
│   ├── weeklyHigh (number)
│   ├── weeklyLow (number)
│   ├── dailyHigh (number)
│   ├── dailyLow (number)
│   ├── weeklyOpen (number)
│   ├── bias (bullish/bearish/neutral)
│   ├── supplyZones (array of {top, bottom, notes})
│   ├── demandZones (array of {top, bottom, notes})
│   └── notes (text)
│
├── routines/{date}/        (date format: YYYY-MM-DD)
│   ├── preSession (object of checklist items with boolean values)
│   ├── completed (boolean)
│   └── sessionNotes (text)
│
└── weeklyReviews/{weekId}/ (weekId format: YYYY-WNN)
    ├── totalTrades (number)
    ├── wins (number)
    ├── losses (number)
    ├── breakevens (number)
    ├── winRate (number)
    ├── totalPnl (number)
    ├── avgRR (number)
    ├── disciplineScore (1-10)
    ├── ruleFollowRate (number)
    ├── bestTrade (text)
    ├── worstTrade (text)
    ├── focusNextWeek (text)
    └── notes (text)

---

## Pages & Features

### 1. Auth Pages
- Login page (email + password)
- Register page (email + password + display name)
- Protected routes — redirect to login if not authenticated
- Persist auth state
- Nice dark themed forms matching app design

---

### 2. Dashboard (/)
Shows overview of current trading status.

Top row — 4 stat cards:
- Account Balance (demo/live toggle affects all data)
- This Week P&L ($ + %)
- Win Rate (this week)
- Rule Follow Rate (this week) — most important metric

Second row:
- Recent 5 trades table (pair, direction, result, P&L, rules followed)
- Daily routine checklist progress (today's checklist, tick items inline)

Third row:
- P&L chart (last 30 days, line chart using Recharts)
- Pair breakdown (which pairs traded most, pie chart)

Demo/Live toggle at top right — switches ALL data on dashboard.

---

### 3. Trade Planner (/planner)
Port the existing trade planner calculator exactly.

Pairs supported with correct calculation types:
- EUR/USD, GBP/USD, AUD/USD, NZD/USD → USD_QUOTE (pip value = $10/lot fixed)
- USD/JPY → USD_BASE_JPY (pip = 0.01, value = (0.01/price)×100000)
- USD/CAD, USD/CHF → USD_BASE (pip = 0.0001, value = (0.0001/price)×100000)
- XAU/USD → COMMODITY (contract = 100oz, value per $1 = $100/lot)
- XAG/USD → COMMODITY (contract = 5000oz)

Inputs (left panel):
- Capital ($) — loads from profile, editable
- Risk % — slider 0.25 to 10, step 0.25
- Leverage
- Pair selector (grouped by type)
- Direction (Long/Short toggle — green/red)
- Entry price
- Stop Loss price
- Take Profit price
- Quick TP buttons: 1:1, 1:2, 1:3, 1:4

Auto-detected (right panel):
- Pair type (USD quote / USD base JPY / USD base / Commodity)
- Pip size
- Value per standard lot

Calculated outputs:
- Risk Amount ($)
- SL distance (pips or $)
- TP distance (pips or $)
- Lot size exact (4 decimal places)
- Lot size rounded (2 decimal places, always floor not round)
- Position size (units)
- Margin required ($)
- Free margin ($)
- Actual risk after rounding ($)
- Potential profit ($)
- Potential loss ($)
- Risk:Reward ratio
- Breakeven win rate (%)

Risk meter bar at top:
- Green 0-2%, Amber 2-4%, Red 4%+
- Scale 0% to 10%

Persist to Firestore (user profile):
- Capital, Risk %, Leverage, last selected Pair

"Save as Trade Plan" button:
- Saves current planner values to sessionStorage
- Navigates to /journal/new with fields pre-filled

---

### 4. Journal (/journal)
Main trade log page.

Top bar:
- Demo / Live toggle (tabs)
- Filter by: pair, result (win/loss/BE), date range, session
- Search by pair or notes
- "Add Trade" button → /journal/new

Stats row (updates with filters):
- Total trades, Wins, Losses, Win Rate, Total P&L, Avg R:R, Rule Follow Rate

Trade table columns:
- Date
- Pair (with flag emoji or colored badge)
- Direction (LONG green / SHORT red badge)
- Entry / SL / TP
- Lot size
- Risk %
- Result (WIN green / LOSS red / BE gray badge)
- P&L ($) — colored
- R:R
- Rules ✓ or ✗
- Actions (view, edit, delete)

Click any row → opens trade detail modal or page.

Delete with confirmation dialog.

---

### 5. Add/Edit Trade (/journal/new and /journal/:id/edit)
Two column form.

Left column — Trade Details:
- Date (date picker, defaults today)
- Account type (Demo / Live toggle)
- Pair selector
- Direction (Long / Short toggle)
- Session (London / New York / Asian / Pacific)
- Entry price
- Stop Loss price
- Take Profit price
- Lot size
- Risk Amount ($)
- Risk % of account
- Planned R:R (auto-calculated)

Right column — Outcome + Review:
- Result (Win / Loss / Breakeven — 3 buttons)
- Actual P&L ($) — manual input
- Actual R:R — auto or manual
- Rules Followed (Yes / No toggle — prominent, required)
- Why I entered (textarea)
- Emotions during trade (textarea)
- Mistakes made (textarea)
- Lessons learned (textarea)
- Screenshot upload (Firebase Storage, show preview)

If navigated from planner:
- Pre-fill: pair, direction, entry, SL, TP, lot size, risk amount, risk %

Pre-trade checklist gate:
Before form is submittable, user must confirm:
[ ] Higher timeframe trend identified
[ ] Valid zone identified (S/R or supply/demand)
[ ] Zone is fresh (first or second touch)
[ ] Confirmation candle printed at zone
[ ] Lot size calculated using trade planner
[ ] SL placed beyond structure
[ ] Minimum 1:2 R:R confirmed
[ ] I am calm — no fear or excitement
[ ] Not trying to recover a loss
[ ] No major news in next 30 minutes

All 10 must be checked before submit button activates.
"Rules Followed" auto-sets to YES if all checked before submitting.

---

### 6. Trade Detail (/journal/:id)
Full view of a single trade.

Show all fields in clean card layout.
Show screenshot if uploaded.
Show pre-trade checklist state.
Show P&L in large colored text.
Edit and Delete buttons.
Back to journal button.

---

### 7. Key Levels (/levels)
Per-pair level management.

Pair selector tabs at top:
EURUSD | GBPUSD | AUDUSD | NZDUSD | USDJPY | USDCAD | USDCHF | XAUUSD | XAGUSD

For selected pair:

Weekly Levels card:
- Weekly High (number input)
- Weekly Low (number input)
- Weekly Open (number input)
- Auto-resets prompt on Monday (remind user to update)

Daily Levels card:
- Daily High (number input)
- Daily Low (number input)
- Today's Open (number input)
- Auto-resets prompt each day

Bias card:
- Bullish / Bearish / Neutral selector (3 buttons, colored)

Supply Zones list:
- Add zone: top price, bottom price, notes
- List of zones with delete button
- Each zone shown as colored band (red tint)

Demand Zones list:
- Add zone: top price, bottom price, notes
- List of zones with delete button
- Each zone shown as colored band (green tint)

Notes:
- Free text area for pair-specific notes

All data saved to Firestore in realtime on change (debounced 500ms).

---

### 8. Routines (/routines)
Daily pre-session checklist + history.

Today's Checklist:
[ ] Checked economic calendar for high-impact news
[ ] Marked weekly levels on all watchlist pairs
[ ] Marked daily levels (yesterday's H/L)
[ ] Identified H4 market structure per pair
[ ] Noted bias per pair (bullish/bearish/neutral)
[ ] No major news in next 2 hours
[ ] I am in a calm mental state
[ ] Set price alerts at key zones

Progress bar showing X/8 complete.
Timestamp auto-saved when each item checked.
Session notes textarea.
"Complete Session" button when all checked.

Routine History:
Table of past sessions — date, completion status, items completed.

---

### 9. Weekly Review (/review)
Weekly performance review form.

Auto-populated from trades this week:
- Total trades, wins, losses, win rate
- Total P&L
- Average R:R
- Rule follow rate

User fills in:
- Discipline score (1-10 slider)
- Best trade this week (text)
- Worst trade this week (text)
- Main mistake repeated (text)
- Focus / improvement for next week (text)
- General notes (text)

History:
Past weekly reviews listed by week.
Click to view any past review.

---

## Sidebar Navigation
Left sidebar, collapsible on mobile.

Links:
- Dashboard (home icon)
- Trade Planner (calculator icon)
- Journal (book icon) — show trade count badge
- Key Levels (layers icon)
- Routines (checklist icon) — show today's progress
- Weekly Review (chart icon)
- Settings (gear icon) — profile, balance update, logout

At bottom of sidebar:
- Demo / Live mode indicator
- Account balance
- User display name

---

## Settings Page (/settings)
- Update display name
- Update demo account balance
- Update live account balance
- Update default risk %
- Update default leverage
- Change password
- Logout button (red)

---

## Global State (Zustand store)
```js
{
  accountType: 'demo', // 'demo' | 'live'
  setAccountType: fn,
  user: null,
  profile: null,
}
```

---

## Firebase Hooks

### useAuth.js
- currentUser from Firebase Auth
- login(email, password)
- register(email, password, displayName)
- logout()
- loading state

### useTrades.js
- realtime onSnapshot listener
- filter by type (demo/live)
- computed stats (winRate, totalPnl, ruleFollowRate, avgRR)

### useLevels.js
- load/save levels per pair
- debounced Firestore writes (500ms)

### useProfile.js
- load user profile
- update profile fields

---

## Calculations (utils/calculations.js)
Exact pip and lot size formulas:

```js
const PAIRS = {
  EURUSD: { type:'USD_QUOTE', pipSize:0.0001, contractSize:100000, decimals:5 },
  GBPUSD: { type:'USD_QUOTE', pipSize:0.0001, contractSize:100000, decimals:5 },
  AUDUSD: { type:'USD_QUOTE', pipSize:0.0001, contractSize:100000, decimals:5 },
  NZDUSD: { type:'USD_QUOTE', pipSize:0.0001, contractSize:100000, decimals:5 },
  USDJPY: { type:'USD_BASE_JPY', pipSize:0.01, contractSize:100000, decimals:3 },
  USDCAD: { type:'USD_BASE', pipSize:0.0001, contractSize:100000, decimals:5 },
  USDCHF: { type:'USD_BASE', pipSize:0.0001, contractSize:100000, decimals:5 },
  XAUUSD: { type:'COMMODITY', pipSize:1, contractSize:100, decimals:2 },
  XAGUSD: { type:'COMMODITY', pipSize:1, contractSize:5000, decimals:2 },
}

function valuePerStdLot(pair, price) {
  if (pair.type === 'USD_QUOTE') return 10
  if (pair.type === 'COMMODITY') return pair.contractSize
  return (pair.pipSize / price) * pair.contractSize
}

function calculateLotSize(riskAmount, slPips, pipValuePerLot) {
  const exact = riskAmount / (slPips * pipValuePerLot)
  const rounded = Math.floor(exact * 100) / 100  // always floor, never round up
  return { exact, rounded }
}

function breakEvenWinRate(rr) {
  return (1 / (1 + rr)) * 100
}
```

---

## Important Rules for Claude Code

1. Use functional components + hooks only, no class components
2. All Firebase calls in dedicated firebase/ files, not in components
3. Real-time Firestore listeners (onSnapshot) not one-time gets — so UI updates live
4. All number inputs: use monospace font
5. Loading states on all async operations
6. Error handling on all Firebase calls with user-friendly messages
7. Mobile responsive — sidebar collapses on mobile
8. No mock data — connect to real Firebase from the start
9. Lot size always floors to 0.01 (Math.floor(x * 100) / 100), never Math.round
10. Demo/Live toggle affects ALL data across ALL pages
11. Pre-trade checklist must all be checked before trade form submits
12. Rule follow rate is as important as win rate — show both prominently everywhere
13. Protect all routes — redirect to /login if not authenticated
14. Environment variables for all Firebase config — never hardcode

---

## File Structure to Create
src/
├── firebase/
│   ├── config.js
│   ├── auth.js
│   ├── trades.js
│   ├── levels.js
│   ├── routines.js
│   ├── reviews.js
│   └── profile.js
├── hooks/
│   ├── useAuth.js
│   ├── useTrades.js
│   ├── useLevels.js
│   ├── useRoutines.js
│   └── useProfile.js
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── TradePlanner.jsx
│   ├── Journal.jsx
│   ├── TradeForm.jsx
│   ├── TradeDetail.jsx
│   ├── Levels.jsx
│   ├── Routines.jsx
│   ├── WeeklyReview.jsx
│   └── Settings.jsx
├── components/
│   ├── Sidebar.jsx
│   ├── StatCard.jsx
│   ├── TradeTable.jsx
│   ├── ChecklistItem.jsx
│   ├── PairSelector.jsx
│   ├── DirectionToggle.jsx
│   ├── RiskMeter.jsx
│   ├── ProtectedRoute.jsx
│   └── ConfirmDialog.jsx
├── store/
│   └── useAppStore.js
├── utils/
│   ├── calculations.js
│   └── formatters.js
├── App.jsx
└── main.jsx

---

Start by:
1. Setting up Vite + React + Tailwind
2. Firebase config and auth
3. App.jsx with React Router routes and ProtectedRoute
4. Sidebar layout
5. Then build each page in this order: Dashboard → TradePlanner → Journal → TradeForm → Levels → Routines → WeeklyReview → Settings

Use the dark theme colors throughout. Make it feel like a professional trading terminal, not a generic CRUD app.