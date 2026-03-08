# Feature 5: Create User Profile

## Date: 2026-03-07

## Changes

### Migration: `docs/migrations/003-profile-table.sql`
- Created `profiles` table with `id`, `user_id` (unique, references auth.users), `display_name` (nullable), `created_at`
- 1-to-1 relationship with `auth.users` via `user_id UNIQUE` constraint
- `ON DELETE CASCADE` so profile is removed when user is deleted
- RLS policies: users can only read/update their own profile
- Database trigger `on_auth_user_created` automatically creates a profile row when a new user signs up via `handle_new_user()` function

### Type: `src/types/database.ts`
- Added `ProfileRow` interface

### Schema: `src/schemas/profile.schema.ts`
- Zod schema for profile update validation (`display_name` nullable string)

### Hook: `src/hooks/use-profile.ts`
- `useProfile()` — fetches current user's profile via TanStack Query
- `useUpdateProfile()` — mutation to update profile fields
