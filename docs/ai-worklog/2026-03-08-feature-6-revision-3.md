# Feature 6 Revision 3: Edit button, price decimal, calculator fix

## Date: 2026-03-08

## Changes

### 1. Edit button on transaction list items
- Added `Pencil` edit button in the expanded details panel alongside the delete button
- Navigates to `/main/transactions/$txId/edit`
- Created `EditTransactionPage` at `src/pages/edit-transaction-page.tsx`
  - Pre-fills form from existing transaction data via `useTransaction(id)` hook
  - Uses `useUpdateTransaction()` mutation (delete old items + insert new ones)
- Added route `transactions/$txId/edit` in router.tsx

### 2. Price field — 1 decimal point only
- Changed `step="0.01"` to `step="0.1"` on the price input in PaymentItemRow
- Calculator `safeEval` now rounds to 1 decimal (`Math.round(result * 10) / 10`)

### 3. Calculator initial value bug fix
- Root cause: `handleOpenChange` was only called by Radix Dialog's internal events (overlay/close click), not when `open` was set programmatically via `setCalcOpen(true)`
- Fix: replaced with `useEffect` that syncs `expression` state whenever `open` becomes true, ensuring the current price value is always brought into the calculator

### New Files
- `src/pages/edit-transaction-page.tsx`

### Modified Files
- `src/components/transactions/calculator-dialog.tsx` — useEffect for initial value sync + 1 decimal rounding
- `src/components/transactions/payment-item-row.tsx` — step="0.1"
- `src/components/transactions/transaction-list-item.tsx` — added edit button
- `src/hooks/use-transactions.ts` — added useTransaction(), useUpdateTransaction()
- `src/router.tsx` — added edit transaction route
- `src/i18n/locales/en.json` — added editTitle, save keys
