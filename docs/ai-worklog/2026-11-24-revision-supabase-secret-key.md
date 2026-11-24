# Supabase secret key

- Read `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the Next.js server client. The secret goes in `apikey` and signed-in data requests carry the user's access token in `Authorization` so the existing RLS policies apply.
- Block Supabase data requests without a user token and keep secret-bearing requests on the configured Supabase origin.
- Update the environment template and setup instructions for local development and deployment.

Lint and all 17 tests passed. The Supabase tests covered password sign-in, HTTP-only cookies, authenticated profile reads, unauthenticated access, and invalid key configuration using a mock service. The production build passed with Webpack after the sandbox blocked a local port used by Turbopack. The test secret was absent from all 57 browser assets.
