# Task: Feature 3 — Main Page UI

## Changes

### Router (`src/router.tsx`)
- Added 4 nested routes under `/main`: `transactions`, `statistics`, `meta`, `transfer`
- Login now redirects to `/main/transactions` (more direct)
- `mainRoute` remains the protected parent layout with auth guard + user loader

### Main page layout (`src/pages/main-page.tsx`)
- Replaced old centered card with full-height flex column layout
- `max-w-[700px] mx-auto` fixed container width
- **Top bar**: app title (left) + `+` action button (right), `h-14`, border bottom
- **Content**: `flex-1 overflow-y-auto` with `<Outlet />` for tab content
- **Bottom nav**: `h-16`, 4 tab links with active state styling via `useRouterState`
- Bare `/main` path redirects to `/main/transactions` via `useEffect`
- Hydrates Zustand auth store from loader data on mount

### Tab pages (all placeholder/dummy data)
| File | Content |
|---|---|
| `src/pages/tabs/transactions-tab.tsx` | Month selector + expense list + total |
| `src/pages/tabs/statistics-tab.tsx` | Summary card + category progress bars + bar chart |
| `src/pages/tabs/meta-tab.tsx` | Currency picker + members + categories + logout |
| `src/pages/tabs/transfer-tab.tsx` | Who-owes-who list + total + recalculate button |

### i18n (`src/i18n/locales/en.json`)
- Added `transactions.*`, `statistics.*`, `meta.*`, `transfer.*` namespaces
- All tab UI text goes through `t()`
