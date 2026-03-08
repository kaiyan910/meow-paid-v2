# Feature 8: Transfer Page

## Date: 2026-03-08

## Changes

### Month selector (refactored)
- Refactored `MonthSelector` to accept props (`currentMonth`, `onPrevMonth`, `onNextMonth`, `onSetMonth`) instead of being tightly coupled to `useTransactionStore`
- Updated `TransactionsTab` to pass store values as props
- Both transactions and transfer pages now reuse the same `MonthSelector` component

### Transfer page
- Month selector with year/month picker (same UX as transactions page)
- Summary section showing total expense (left) and average cost per person (right)
- User list showing each user's display name, total paid, and amount owed
  - Amount owed = max(0, average - paid), negative values show as $0.0
  - Shows all profiles even if a user paid nothing that month

### Header action button
- "+" button now only shows on transactions and meta tabs (hidden on statistics and transfer)

### New files
- `src/store/transfer.store.ts` — Zustand store for transfer page month state
- `src/hooks/use-transfer.ts` — `useTransferSummary(month)` hook that fetches and aggregates transaction totals per payee

### Modified files
- `src/components/transactions/month-selector.tsx` — Refactored to accept props
- `src/pages/tabs/transactions-tab.tsx` — Pass store values as props to MonthSelector
- `src/pages/tabs/transfer-tab.tsx` — Complete rewrite with real data
- `src/pages/main-page.tsx` — Show "+" button only on meta/transactions tabs
- `src/i18n/locales/en.json` — Updated transfer keys (totalExpense, averageCost, paid, owes, empty)
