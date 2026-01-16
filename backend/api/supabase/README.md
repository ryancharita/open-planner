# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Run migrations:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_create_users_table.sql`
4. Execute the SQL

### Option 3: Using psql

```bash
psql -h your-db-host -U postgres -d postgres -f migrations/001_create_users_table.sql
```

## Migration Files

### 001_create_users_table.sql

Creates the `users` table with:
- `id` (UUID, primary key)
- `clerk_user_id` (TEXT, unique, indexed)
- `currency` (TEXT, default 'USD')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ, auto-updated)

Also creates:
- Row Level Security (RLS) policies
- Database functions for secure user operations:
  - `get_or_create_user(p_clerk_user_id)` - Creates user if doesn't exist
  - `get_user_by_clerk_id(p_clerk_user_id)` - Gets user by Clerk ID
  - `update_user_currency(p_clerk_user_id, p_currency)` - Updates user currency

### 002_create_categories_table.sql

Creates the `categories` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `name` (TEXT, unique per user)
- `icon` (TEXT, optional)
- `color` (TEXT, default '#3B82F6')
- `is_default` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ, auto-updated)

Also creates:
- Row Level Security (RLS) policies
- Database functions for secure category operations:
  - `get_categories_for_user(p_clerk_user_id)` - Gets all categories for a user
  - `create_category(p_clerk_user_id, p_name, p_icon, p_color)` - Creates a new category
  - `update_category(p_clerk_user_id, p_category_id, p_name, p_icon, p_color)` - Updates a category
  - `delete_category(p_clerk_user_id, p_category_id)` - Deletes a category

### 003_seed_default_categories.sql

- Creates `seed_default_categories_for_user(p_user_id)` function
- Updates `get_or_create_user` to automatically seed default categories for new users
- Seeds 10 default categories: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Travel, Personal Care, Other

## Security

- RLS is enabled on the `users` table
- Direct table access is restricted
- All operations go through SECURITY DEFINER functions that validate ownership
- Service role (used by backend) bypasses RLS for function execution
- Functions ensure users can only access/modify their own data
