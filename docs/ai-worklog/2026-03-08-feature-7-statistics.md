# Feature 7: Statistics Page

## Date: 2026-03-08

## Changes

### Tab bar
- Replaced placeholder statistics page with tab-based layout using shadcn Tabs
- Two tabs: "This Month" (default) and "Last 6 Months"

### This Month tab
- Shows total expenses from real Supabase data via `get_monthly_stats` RPC
- Category breakdown by payment subtype with percentage bars
- Removed hardcoded data and monthly trend section

### Last 6 Months tab
- Payment type dropdown with "Total" option (shows all types combined)
- Payment subtype dropdown (dynamically filtered by selected payment type, disabled when "Total" selected)
- Bar chart using recharts + shadcn ChartContainer showing 6 months of data
- 6-month average displayed below the chart
- Data fetched via `get_monthly_totals` RPC with optional type/subtype filters

### Database functions (migration 005)
- `get_monthly_stats(start_date, end_date)` — returns payment subtype breakdown with totals
- `get_monthly_totals(end_date, num_months, p_payment_type_id, p_payment_subtype_id)` — returns monthly totals with optional filters

### New files
- `docs/migrations/005-statistics-functions.sql`
- `src/hooks/use-statistics.ts` — useMonthlyStats, useMonthlyTotals, usePaymentSubtypesByType
- `src/components/statistics/this-month-stats.tsx`
- `src/components/statistics/last-six-months-stats.tsx`
- `src/components/ui/chart.tsx` — shadcn chart component (recharts wrapper)
- `src/components/ui/tabs.tsx` — shadcn tabs component

### Modified files
- `src/pages/tabs/statistics-tab.tsx` — rewrote with tab layout
- `src/i18n/locales/en.json` — added statistics keys (thisMonth, lastSixMonths, paymentType, paymentSubtype, total, all, average, noData)
- `biome.json` — added override to allow dangerouslySetInnerHTML in chart.tsx (shadcn generated)
- `package.json` — added recharts dependency

### Dependencies added
- recharts ^3.8.0
