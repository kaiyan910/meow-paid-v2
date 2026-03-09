# 2026-03-09 — Login Form Unit Tests

## Task
Set up Vitest + React Testing Library and create tests for `login-form.tsx`.

## Changes
- Installed `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- Created `vitest.config.ts` with jsdom environment, path aliases, and setup file
- Created `src/test/setup.ts` for jest-dom matchers
- Added `test` and `test:watch` scripts to `package.json`
- Created `src/components/__tests__/login-form.test.tsx` with 7 tests:
  - Renders email/password fields and submit button
  - Email validation: shows error for invalid format
  - Email validation: no error for valid email
  - Password validation: shows error for < 6 characters
  - Password validation: no error for >= 6 characters
  - Form submission: calls Supabase, sets user, and navigates on success
  - Form submission: displays auth error on failure

## Result
All 7 tests passing.
