# TradeFlow — Implementation Plan

Dark-themed React + Firebase trading journal/planner for a forex trader. See `prompt.md` for the full spec.

## Build Order

- [x] 0. `plan.md` (this file)
- [x] 1. Scaffold Vite + React in project root, install deps (react-router-dom, firebase, zustand, recharts, tailwindcss, lucide-react)
- [x] 2. Tailwind theme (dark trading terminal colors), fonts (Inter + JetBrains Mono), `.env.example`
- [x] 3. Firebase layer: `config.js`, `auth.js`, `trades.js`, `levels.js`, `routines.js`, `reviews.js`, `profile.js` — real-time `onSnapshot` reads, try/catch writes
- [x] 4. Utils: `calculations.js` (pip/lot/margin/R:R formulas, floor-not-round lot sizing), `formatters.js`
- [x] 5. Zustand store: `accountType`, `user`, `profile`
- [x] 6. Hooks: `useAuth`, `useProfile`, `useTrades` (computed stats), `useLevels` (debounced 500ms save), `useRoutines`
- [x] 7. Shared components: `Sidebar`, `StatCard`, `TradeTable`, `ChecklistItem`, `PairSelector`, `DirectionToggle`, `RiskMeter`, `ProtectedRoute`, `ConfirmDialog`
- [ ] 8. Pages, in order:
   - [x] Login (single-user, no registration — see Auth Model below)
   - [x] Dashboard (stat cards, recent trades, routine progress, P&L line + pair pie charts)
   - [x] Trade Planner (full calculator, risk meter, save-as-trade-plan → sessionStorage)
   - [x] Journal (filters, search, stats row, trade table)
   - [x] Trade Form (add/edit, two-column, 10-item pre-trade checklist gate, screenshot upload)
   - [x] Trade Detail (read-only view, edit/delete)
   - [x] Key Levels (per-pair weekly/daily/bias/supply-demand zones, debounced autosave)
   - [x] Routines (8-item daily checklist, progress bar, history)
   - [x] Weekly Review (auto-computed stats + manual review fields, history)
   - [x] Settings (profile, balances, risk/leverage defaults, change password, logout)
- [x] 9. App shell: routing (`App.jsx`), Layout with Sidebar + Outlet, ProtectedRoute wiring
- [ ] 10. Verify: `npm run build`, manual walkthrough of full trade lifecycle, demo/live toggle, mobile responsiveness

## Auth Model — Single User, No Signup
This is a personal single-user app — there is no registration flow.
- `Register.jsx` and `/register` do not exist.
- `Login.jsx` has only email + password; the email field is pre-filled from `VITE_DEFAULT_EMAIL` (editable) and the password field is always empty.
- The one account is seeded manually, once, via `scripts/createUser.js` (`npm run seed:user`) — it creates the Firebase Auth user and the matching `users/{uid}/profile/main` Firestore doc with default balances/risk/leverage. Delete or ignore the script after running it.
- `src/firebase/auth.js` only exports `signIn`, `signOutUser`, `changePassword`, `onAuthChange` — no `signUp`.
- **Manual step required in Firebase Console**: go to Authentication → Settings → User actions → uncheck "Enable create account" to block signups via the API too. This isn't something a script can do — it must be done by hand.

## Key Rules
- Functional components + hooks only
- All Firebase calls isolated in `src/firebase/`
- Real-time listeners (`onSnapshot`), not one-time gets
- Monospace font for all numeric values
- Loading + error states on all async ops
- Lot size floor: `Math.floor(exact * 100) / 100` — never `Math.round`
- Firestore security rules: users can only read/write their own data (`users/{userId}/**` — `request.auth.uid == userId`)
- Screenshot uploads: Firebase Storage path = `users/{userId}/screenshots/{tradeId}`
- Levels autosave: debounce 500ms on every input change, not on blur
- Weekly review weekId format: `YYYY-WNN` (e.g. `2026-W03`)
- Routine date format: `YYYY-MM-DD` (e.g. `2026-07-19`)
- Pre-trade checklist state: saved in the trade document so it can be reviewed later
- Demo/Live toggle: persisted in Zustand + localStorage so it survives page refresh
- All monetary display: `toFixed(2)` with `$` prefix, colored green/red based on positive/negative
- R:R display format: `"1 : 2.50"` not `"2.5"`
- Demo/Live toggle scopes all data everywhere
- Pre-trade checklist: all 10 items required before trade submit
- All routes protected except `/login`, `/register`
- Firebase config from env vars only

## Common Gotchas (avoid these)

### Firebase
- `onSnapshot` listeners must be unsubscribed in `useEffect` cleanup — `return () => unsubscribe()` — missing this is a memory leak
- Firestore nested arrays can't be partially updated — use `arrayUnion`/`arrayRemove` for supply/demand zones, or rewrite the whole array via `setDoc(..., {merge:true})`
- `serverTimestamp()` doesn't work inside arrays — use `Timestamp.now()` for zone `createdAt` fields
- Firebase Storage CORS must be configured for localhost — set in Google Cloud Console if uploads fail locally

### Calculations
- JPY pairs: pip = 0.01, not 0.0001
- Gold/Silver: no pips — dollar move × contract size × lots
- Always use entry price (not current price) for pip value calculation
- SL distance = `Math.abs(entry - stopLoss)`, not `entry - stopLoss` (direction determines long/short, not the raw subtraction sign)

### React
- Trade form is complex — use controlled state consistently, don't mix in a form library halfway
- Recharts needs a fixed-height container — wrap in a div with `h-64` or similar
- File upload preview: use `URL.createObjectURL(file)` for local preview before the Firebase upload completes

### Tailwind
- JetBrains Mono must be registered in `tailwind.config.js` `fontFamily.mono`
- Custom colors must be in `tailwind.config.js`, not just CSS variables (or use arbitrary values like `text-[#22C58B]`)

## Firestore Security Rules
Paste into Firebase Console → Firestore → Rules (also saved as `firestore.rules` in project root):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

## Firebase Storage Rules
Paste into Firebase Console → Storage → Rules (also saved as `storage.rules` in project root):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

## .env.example
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Status
Tracking progress via TodoWrite in the coding session. This file is a static reference copy of the plan.

Real Firebase project credentials are in `.env` (gitignored), not in this file — see `.env.example` for the variable names.

## Firestore Composite Index Required (Key Levels history)
`src/firebase/levelHistory.js` queries `levelHistory` with `where('pair','==',...)` + `where('period','==',...)` + `orderBy('periodId','desc')`. Firestore requires a composite index for this combination — it is **not** automatically created. On first run, opening the Levels page will throw a Firestore error in the browser console containing a direct link to auto-create the index in the Firebase Console; click it once and the query will work from then on. (Alternatively, create manually: collection `levelHistory`, fields `pair` Asc, `period` Asc, `periodId` Desc.)