-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id_is_default ON categories(user_id, is_default);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Function to get user_id from clerk_user_id
CREATE OR REPLACE FUNCTION get_user_id_from_clerk(p_clerk_user_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM users
  WHERE clerk_user_id = p_clerk_user_id
  LIMIT 1;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get categories for a user
CREATE OR REPLACE FUNCTION get_categories_for_user(p_clerk_user_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN QUERY
  SELECT c.id, c.user_id, c.name, c.icon, c.color, c.is_default, c.created_at, c.updated_at
  FROM categories c
  WHERE c.user_id = v_user_id
  ORDER BY c.is_default DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a category
CREATE OR REPLACE FUNCTION create_category(
  p_clerk_user_id TEXT,
  p_name TEXT,
  p_icon TEXT DEFAULT NULL,
  p_color TEXT DEFAULT '#3B82F6'
)
RETURNS categories AS $$
DECLARE
  v_user_id UUID;
  v_category categories;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO categories (user_id, name, icon, color, is_default)
  VALUES (v_user_id, p_name, p_icon, p_color, false)
  RETURNING * INTO v_category;

  RETURN v_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a category
CREATE OR REPLACE FUNCTION update_category(
  p_clerk_user_id TEXT,
  p_category_id UUID,
  p_name TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
)
RETURNS categories AS $$
DECLARE
  v_user_id UUID;
  v_category categories;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify category belongs to user
  SELECT * INTO v_category
  FROM categories
  WHERE id = p_category_id AND user_id = v_user_id
  LIMIT 1;

  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- Prevent updating default categories
  IF v_category.is_default THEN
    RAISE EXCEPTION 'Cannot update default category';
  END IF;

  -- Update only provided fields
  UPDATE categories
  SET
    name = COALESCE(p_name, name),
    icon = COALESCE(p_icon, icon),
    color = COALESCE(p_color, color),
    updated_at = NOW()
  WHERE id = p_category_id AND user_id = v_user_id
  RETURNING * INTO v_category;

  RETURN v_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a category
CREATE OR REPLACE FUNCTION delete_category(
  p_clerk_user_id TEXT,
  p_category_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_category categories;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify category belongs to user
  SELECT * INTO v_category
  FROM categories
  WHERE id = p_category_id AND user_id = v_user_id
  LIMIT 1;

  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  -- Prevent deleting default categories
  IF v_category.is_default THEN
    RAISE EXCEPTION 'Cannot delete default category';
  END IF;

  DELETE FROM categories
  WHERE id = p_category_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Deny all direct access (only service role can access directly)
-- All operations go through SECURITY DEFINER functions which validate ownership
CREATE POLICY "Categories can only be accessed through functions"
  ON categories
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
