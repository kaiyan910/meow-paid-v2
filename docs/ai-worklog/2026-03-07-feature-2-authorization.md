# Task: Feature 2 — Authorization

## Packages added
- `@supabase/supabase-js` — Supabase client
- `@tanstack/react-router` — client-side routing with auth guards
- `@tanstack/react-form` — form state management
- `zod` — schema validation
- `zustand` — auth state store

## New files
| File | Purpose |
|---|---|
| `.env.example` | Supabase env var template |
| `src/lib/supabase.ts` | Singleton Supabase client |
| `src/schemas/auth.schema.ts` | Zod login schema |
| `src/store/auth.store.ts` | Zustand auth store (holds User) |
| `src/router.tsx` | TanStack Router — `/` (login) and `/main` (protected) routes |
| `src/pages/login-page.tsx` | Full-screen login layout |
| `src/pages/main-page.tsx` | Protected page showing user email + logout |

## Modified files
- `src/components/login-form.tsx` — rewritten with TanStack Form, email field, real-time Zod validation, loading spinner
- `src/App.tsx` — now renders `<RouterProvider>` instead of static layout
- `src/i18n/locales/en.json` — added email, main, and error translation keys

## Auth flow
1. `beforeLoad` on `/` redirects to `/main` if session exists
2. `beforeLoad` on `/main` redirects to `/` if no session
3. Login form calls `supabase.auth.signInWithPassword`, sets Zustand store, navigates to `/main`
4. Main page loader calls `supabase.auth.getUser()` to get email
5. Logout calls `supabase.auth.signOut`, clears store, navigates to `/`

## Setup required
Copy `.env.example` to `.env.local` and fill in Supabase project URL and anon key.
