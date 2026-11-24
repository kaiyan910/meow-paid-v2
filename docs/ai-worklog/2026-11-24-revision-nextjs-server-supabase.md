# Next.js and server-side Supabase

- Migrated MeowPaid's routes, layouts, Tailwind build, and PWA manifest to the Next.js App Router.
- Moved Supabase sign-in, sign-out, profile, metadata, transactions, statistics, settlements, and logo storage behind the app's server routes. The routes verify sessions using HTTP-only cookies and keep existing database RLS policies in effect.
- Added migration 006 to save each transaction and its payment items atomically. Apply it before using the new write endpoints.
- Replaced the GitHub Pages workflow with CI. The app now requires a Node.js deployment.

Lint, type checking, eight Vitest tests, and the production build passed. A local PostgreSQL instance verified transaction rollback on invalid items. A browser smoke test against a mock Supabase service verified sign-in, protected navigation, transaction writes, statistics, settlements, metadata, profile updates, logo upload and display, sign-out, and PWA registration. Browser requests stayed on the app origin.
