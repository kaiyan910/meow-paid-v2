# Feature 6: Create Transaction Logic

## Date: 2026-03-08

## Summary
Implemented full transaction CRUD with list view and create form.

## Database
### Migration: `docs/migrations/004-transactions.sql`
- `transactions` table: id, transaction_date, shop_id (FK shops), payee_id (FK auth.users), price, remark, created_at
- `transaction_items` table: id, transaction_id (FK transactions, CASCADE), payment_subtype_id (FK payment_subtypes), price, created_at
- RLS: authenticated users can CRUD both tables
- Indexes on transaction_date and transaction_id for query performance

## Dependencies Added
- `moment` for date handling

## New Files
- `src/schemas/transaction.schema.ts` — Zod validation for transaction form
- `src/store/transaction.store.ts` — Zustand store for current month state
- `src/hooks/use-transactions.ts` — useTransactions (monthly query), useCreateTransaction, useDeleteTransaction
- `src/components/transactions/month-selector.tsx` — prev/next month navigation
- `src/components/transactions/transaction-list-item.tsx` — expandable row with payment breakdown
- `src/components/transactions/shop-autocomplete.tsx` — filterable shop input
- `src/components/transactions/payment-item-row.tsx` — dynamic payment subtype + price pair
- `src/pages/create-transaction-page.tsx` — full create transaction form
- `src/components/ui/calendar.tsx` — shadcn Calendar (react-day-picker)
- `src/components/ui/popover.tsx` — shadcn Popover
- `src/components/ui/collapsible.tsx` — shadcn Collapsible

## Modified Files
- `src/types/database.ts` — added TransactionRow, TransactionItemRow, TransactionWithDetails
- `src/hooks/use-profile.ts` — added useProfiles() for payee dropdown
- `src/i18n/locales/en.json` — added transaction form translation keys
- `src/router.tsx` — added /main/transactions/create route
- `src/pages/main-page.tsx` — header "+" navigates to create transaction when on transactions tab
- `src/pages/tabs/transactions-tab.tsx` — replaced dummy data with real Supabase queries

## UI Features
- Month selector with prev/next navigation
- Transaction list sorted by date descending with monthly total
- Clickable rows expand to show payment breakdown (subtype + price per item)
- Delete button in expanded details panel
- Create form with: date picker (calendar popover), shop autocomplete, payee dropdown, dynamic payment detail rows, remark field, Zod validation
