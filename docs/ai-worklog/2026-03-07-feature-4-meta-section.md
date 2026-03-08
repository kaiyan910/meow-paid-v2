# Task: Feature 4 — Meta Section CRUD

## Packages added
- `@tanstack/react-query` — data fetching / caching for Supabase queries

## New files

### Infrastructure
| File | Purpose |
|---|---|
| `src/types/database.ts` | Row types for 4 Supabase tables |
| `src/schemas/meta.schema.ts` | Zod schemas for Shop, ShopCategory, PaymentType, PaymentSubtype |
| `src/store/meta.store.ts` | Zustand store for active meta tab + dialog state |
| `src/hooks/use-meta-queries.ts` | Generic + typed TanStack Query CRUD hooks |
| `src/components/ui/dialog.tsx` | shadcn Dialog component (radix-ui) |
| `docs/migrations/001-meta-tables.sql` | SQL migration with RLS policies |

### Meta UI components
| File | Purpose |
|---|---|
| `src/components/meta/meta-list.tsx` | Generic list with delete button, click-to-edit |
| `src/components/meta/meta-form-dialog.tsx` | Create/edit dialog using TanStack Form + Zod |

## Modified files
- `src/pages/tabs/meta-tab.tsx` — full rewrite with inner tab bar (商店 / 商店類型 / 支出類型 / 支出子類型), list rendering, CRUD dialogs, logout
- `src/pages/main-page.tsx` — header "+" wired to open meta create dialog when on meta tab
- `src/main.tsx` — wraps app with QueryClientProvider
- `src/i18n/locales/en.json` — meta tab labels, form field labels, actions

## Data model (4 Supabase tables)
- `shop_categories` — id, name, user_id
- `shops` — id, name, shop_category_id (FK), logo, user_id
- `payment_types` — id, name, user_id
- `payment_subtypes` — id, name, payment_type_id (FK), user_id

## Architecture
- Inner tab bar (Zustand state, not URL routes) switches between 4 meta types
- MetaList displays items with delete; clicking opens edit dialog
- MetaFormDialog adapts fields per meta type (Shop has category select + logo; PaymentSubtype has payment_type select)
- Header "+" button triggers create via Zustand `setCreateDialogOpen(true)`
- TanStack Query handles cache invalidation on mutations
