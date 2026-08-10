# TradeFlow — Where To Go Next

*Written as if by a trader who's been in the market 20 years and has shipped software the whole time. Grounded in what's actually in this codebase today — not a generic "add AI" wishlist.*

## The honest take first

You haven't built a "trading journal app." You've built a trading *operating system* — planner, journal, levels, routines, weekly/monthly review, economic calendar, education library, live price. Most retail traders never build even one of these pieces for themselves. You've built eight.

The problem is not missing features. The problem is **three silent leaks** that will quietly cap your edge no matter how many more pages you add:

1. Your most important discipline metric (`rulesFollowed`) is hardcoded to `true`. It cannot ever be `false`. Every "rule compliance vs performance" chart you look at is lying to you by construction — of course rule-followers outperform rule-breakers, when 100% of trades are tagged as followers.
2. You have no real drawdown number anywhere. "Drawdown" today means "is this calendar month net negative" — that resets to zero every month even if you're on a 6-week losing slide. A prop firm would reject this instantly.
3. Every number in this app is self-reported and client-trusted. `pnl`, `result`, `rulesFollowed` — you type them, Firestore stores them, nothing checks them. That's fine for a solo journal. It stops being fine the moment you want this to *certify* discipline to yourself (or to a funded-account evaluator).

Fix those three before adding anything new. They're cheap to fix and they're the difference between a journal that flatters you and one that corrects you.

---

## Priority 1 — Fix the lies (do these first, this week)

### 1. Make `rulesFollowed` actually mean something
`TradeForm.jsx` sets `rulesFollowed: true` unconditionally once the pre-trade checklist is complete. But "I checked all 10 boxes before entering" and "I followed my rules through the whole trade" are different claims — you can tick every box at entry and still move your stop loss mid-trade out of fear. That second failure is the one that actually blows accounts.

Add a second, honest checkpoint at trade *close* time (in `TradeDetail.jsx` or as part of closing out a trade): "Did you deviate from plan after entry? (moved SL / moved TP / added to losing position / closed early out of fear / none)". Store it separately from the entry checklist. Recompute `rulesFollowed` as entry-checklist-complete AND no-post-entry-deviation. Now your Rule Compliance analytics becomes the single most valuable chart in the app instead of a decoration.

### 2. Build a real drawdown metric
You already store every trade with a `pnl` and `createdAt`. That's all you need for a proper equity curve:
- Running balance = starting balance + cumulative `pnl` ordered by date.
- Peak-to-date = running max of that series.
- Drawdown at any point = `(peak - current) / peak`.
- Max drawdown = the largest such value ever observed.

This is maybe 15 lines in `src/utils/` next to `streaks.js` — it's the same shape of problem (walk the trade list once, keep running state). Surface current drawdown and max drawdown on the Dashboard next to the existing loss-streak banner. This one number is what separates "had a bad week" from "am I still in control of my risk."

### 3. Add expectancy and profit factor
You compute win rate and avg R:R separately, but never combine them into the number that actually predicts whether your strategy makes money over 100 trades:

```
Expectancy ($) = (WinRate × AvgWin) − (LossRate × AvgLoss)
Profit Factor = GrossProfit / GrossLoss
```

Right now you can have a 70% win rate and still be unprofitable if your average loss dwarfs your average win, and nothing in the app would tell you. Add both to `computeStats()` in `useTrades.js` — you already have every input (`pnl`, `result`) sitting right there. This single addition does more for "profitable" than any new page would.

### 4. Separate average win from average loss
You track total P&L and P&L-per-trade, but never "when I win, I make $X; when I lose, I lose $Y." That ratio, next to your win rate, is the entire game of trading. Cheap to add, high signal.

---

## Priority 2 — Close the gaps that limit what you can *learn* from your own data

### 5. Add a `setupType` / strategy tag to every trade
You have a full "Trading Strategies" education folder (Trend Following, Breakout, Pullback, Range, Reversal) but **no field on the trade itself says which one you were running.** This means Analytics can break performance down by pair and by session, but never by *strategy* — which is usually the single highest-leverage cut a trader can look at ("my breakout entries have a 38% win rate and I should stop taking them"). Add a dropdown sourced from your existing strategy folder names, make it required on TradeForm, add a "Performance by Setup" panel next to the existing pair/session breakdowns using the `PerformanceBreakdown` component you've already built — this is mostly wiring, not new engineering.

### 6. Fix the CSV export before you rely on it for anything
It's hardcoded to 19 columns and silently drops `screenshotUrl`, `preTradeChecklist`, and `createdAt`. If you ever want to back up your journal outside Firebase, or run your own analysis in a spreadsheet/Python, you're currently exporting a lossy copy without knowing it. Make it export every field on the trade document.

### 7. Connect Live Price to the things that already want it
You built `useLivePrice` this session — good — but right now it's an island: fetch a price, look at it, it evaporates on navigation. Meanwhile your Levels page already computes "distance in pips from a reference price to your daily/weekly high/low," and your reference price today is *last planner entry*, which goes stale the moment the market moves. Two small, high-value wires:
- On the Levels page, add a "Fetch live price" button next to each pair that updates the reference price used for break-of-level distance, instead of relying on a stale planner price.
- On Live Price, show distance-in-pips to that pair's current daily/weekly high/low/bias zones (you already have `distanceInPips` and `checkBreak` in `levelMetrics.js`) — this turns "here's a number" into "here's a number *relative to the level I said I care about*."

### 8. Give the education library a memory
`Docs` is excellent but 100% stateless — no bookmarks, no "mark as read," no way to link a note to a mistake. The cheapest version that adds real value: when a trade's `mistakes` field matches one of your existing `MISTAKE_TAGS` (FOMO, moved SL, revenge trading, etc.), show a "related reading" link to the matching note in `src/forex/` (e.g. revenge-trading mistakes → `04 Risk Management/Overtrading.txt`). You already tag mistakes and you already have topically-matching notes; nobody currently connects them.

---

## Priority 3 — "Managed" and "risk-free" (the words you used)

Nothing makes trading risk-free — be suspicious of anything that claims otherwise, including your own app. What you *can* build is a system that makes it hard to accidentally take on more risk than you decided on in advance. You're already close:

### 9. A hard daily-loss circuit breaker
You have `maxDrawdownLimit` in Settings, and a loss-streak warning banner on the Dashboard — but both are purely observational. Nothing stops you from opening TradeForm and logging trade #5 after you've already blown through your daily loss limit on trades #1–4. Add a real gate: if today's realized P&L (sum of today's trades) is at or below `-dailyLossLimit`, show a blocking banner on TradeForm and Dashboard — "Daily loss limit reached. No further trades today." — non-dismissible until midnight. This is the single feature most prop firms enforce mechanically because it's the single biggest account-killer they see. You have every piece of data needed; you're just not using it to say no.

### 10. Position-size sanity check before journaling
`calculateTradePlan` already flags "position rounds to 0 lots" or "spread wider than stop" as warnings in the Planner — but TradeForm (where you actually log the real trade) does no equivalent check. Add a soft warning in TradeForm if `riskPercent` on the trade being logged exceeds the risk-per-trade rule you've written for yourself in `04 My Risk Rules.txt`. You could even parse that file's stated max-risk-% (it's already bundled via `useDocs`) and use it as the threshold, so your app's rule enforcement is literally sourced from your own rulebook instead of a second, easy-to-forget setting.

### 11. Weekly/Monthly review auto-flag instead of manual-only
Right now weekly/monthly review is 100% manual reflection (discipline score slider, free text). Since you already compute rule-compliance, streaks, and (once you add them) expectancy/drawdown — auto-populate a short "what changed" summary at the top of each review: "Rule follow rate dropped from 92% to 71% this week. Your 3 broken-rule trades cost you $340 combined (see Mistake Breakdown)." This turns the review from a blank page you have to fill from memory into a page that already knows what happened and just asks you to explain *why*.

---

## Priority 4 — Nice-to-have, don't do these until 1–3 are done

- **Multi-timeframe screenshot support** (you have entry/exit screenshots; a "context" screenshot showing the higher-timeframe structure at entry would let weekly review actually show *why* a setup looked good, not just whether it won).
- **Custom free-form tags** in addition to the fixed mistake-tag list — your mistake analysis is currently limited to 10 hardcoded keyword patterns; a tag input would let patterns you haven't thought of yet surface over time.
- **Fix the `ALL_INSTRUMENTS`/`PAIRS` mismatch** — indices (US30, NAS100, etc.) can be tagged in Events/Favorites but can't actually be planned or journaled since they're not in `PAIRS`. Either add them to `PAIRS` properly or stop offering them as favorites — right now they're a dead end that looks like a feature.
- **De-duplicate timezone/UTC-offset logic** — it's implemented three separate times across Dashboard, useEvents, and useAlerts. Not urgent, but the next timezone bug will be a fun one to chase across three files instead of one.

---

## What I would explicitly *not* build

- A backtesting engine or strategy simulator. You have a "Backtesting And Demo Practice" education folder telling you to do this manually first — trust your own material.
- AI trade signals / auto-entry suggestions. The entire architecture of this app is "slow down, check your rules, log your reasoning." Signal generation is the opposite instinct and undermines everything else you've built.
- Social/leaderboard/sharing features. `firestore.rules` is intentionally single-tenant (`request.auth.uid == userId` everywhere). Keep it that way — the moment this becomes performative (visible to others), your journal entries stop being honest.
- Multi-broker live account sync. High engineering cost, real security surface (broker credentials), and it solves a problem you don't have yet — you're not missing trade data, you're under-using the trade data you already collect.

---

## If you only do three things this month

1. Fix `rulesFollowed` so it can actually be false (Priority 1.1).
2. Add expectancy + profit factor + real drawdown to `computeStats()`/Dashboard (Priority 1.2–1.3).
3. Add the daily-loss circuit breaker to TradeForm (Priority 3.9).

Everything else compounds on top of those three. None of them require a new page, a new dependency, or a new API key — they're changes to code you've already written, using data you're already collecting.
