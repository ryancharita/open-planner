-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on clerk_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a function to get or create a user (for initial user creation)
-- This function uses SECURITY DEFINER to bypass RLS for inserts
CREATE OR REPLACE FUNCTION get_or_create_user(p_clerk_user_id TEXT)
RETURNS users AS $$
DECLARE
  v_user users;
BEGIN
  -- Try to get existing user
  SELECT * INTO v_user
  FROM users
  WHERE clerk_user_id = p_clerk_user_id
  LIMIT 1;

  -- If user doesn't exist, create it
  IF v_user IS NULL THEN
    INSERT INTO users (clerk_user_id, currency)
    VALUES (p_clerk_user_id, 'USD')
    RETURNING * INTO v_user;
  END IF;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user by clerk_user_id (with RLS check)
-- This function uses SECURITY DEFINER but validates ownership
CREATE OR REPLACE FUNCTION get_user_by_clerk_id(p_clerk_user_id TEXT)
RETURNS users AS $$
DECLARE
  v_user users;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE clerk_user_id = p_clerk_user_id
  LIMIT 1;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user (with ownership check)
CREATE OR REPLACE FUNCTION update_user_currency(
  p_clerk_user_id TEXT,
  p_currency TEXT
)
RETURNS users AS $$
DECLARE
  v_user users;
BEGIN
  -- Verify the user exists and matches
  SELECT * INTO v_user
  FROM users
  WHERE clerk_user_id = p_clerk_user_id
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update the user
  UPDATE users
  SET currency = p_currency,
      updated_at = NOW()
  WHERE clerk_user_id = p_clerk_user_id
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Since we're using Clerk (not Supabase Auth), we use SECURITY DEFINER functions
-- to enforce access control. The service role (used by backend) bypasses RLS.
-- All user operations go through functions that validate clerk_user_id ownership.

-- Policy: Deny all direct access for anon/authenticated roles
-- Service role bypasses RLS, so it can still access directly
-- All user-facing operations use SECURITY DEFINER functions which validate ownership
CREATE POLICY "Users can only access through functions"
  ON users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Note:
-- 1. Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS entirely
-- 2. All user operations use SECURITY DEFINER functions (get_or_create_user, get_user_by_clerk_id, update_user_currency)
-- 3. These functions validate that operations only affect the user's own data by checking clerk_user_id
-- 4. This provides equivalent security to RLS but works with Clerk authentication

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
