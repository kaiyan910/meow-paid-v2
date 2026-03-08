# Feature 5: Create User Profile

## Requirement
- create a table to store the user profile, name it "profile" with fields: 
  - `display_name` text nullable
  - `user_id` reference non-nullable
  - `created_at` timestamptz default now()
- it should have a 1-to-1 relationship with the `auth.users` table row
- create supabase database trigger, when a new user is created create the `profile` row respectively
- all database related changes should be save to `docs/migrations` directory