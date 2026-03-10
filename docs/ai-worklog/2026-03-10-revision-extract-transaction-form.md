# 2026-03-10 — Revision: Extract Transaction Form Component with TanStack Form

## Summary
Extracted the shared transaction form from both `CreateTransactionPage` and `EditTransactionPage` into a reusable `TransactionForm` component, replacing manual `useState` form management with TanStack Form (`useForm`).

## Changes

### New Files
- `src/components/transactions/transaction-form.tsx` — Shared form component using TanStack Form with:
  - `form.Field` for each form field (date, shop, payee, remark)
  - `mode="array"` field for dynamic payment items (pushValue/removeValue)
  - `form.Subscribe` for reactive total price calculation and submit button state
  - Field-level validators on submit
  - Final Zod validation on the submission payload

### Modified Files
- `src/pages/edit-transaction-page.tsx` — Simplified to load transaction data and pass default values to `TransactionForm`
- `src/pages/create-transaction-page.tsx` — Simplified to pass empty default values to `TransactionForm`
- `src/schemas/transaction.schema.ts` — Added `transactionItemFormSchema`, `transactionFormSchema`, and `TransactionFormDefaults` type for the form's default values (where price is a string during editing)
- `src/i18n/locales/en.json` — Added `transactions.form.notFound` key
- `src/i18n/locales/zh.json` — Added `transactions.form.notFound` key

## Benefits
- Eliminated duplicated form logic between create and edit pages
- Replaced ~10 `useState` calls with a single `useForm` hook
- Array fields managed via TanStack Form's built-in `pushValue`/`removeValue`
- Form state, validation, and submission handled declaratively
