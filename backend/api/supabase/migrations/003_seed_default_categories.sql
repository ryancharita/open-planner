-- Seed default categories for all users
-- This function creates default categories when a user is first created
CREATE OR REPLACE FUNCTION seed_default_categories_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, is_default)
  VALUES
    (p_user_id, 'Food & Dining', '🍽️', '#EF4444', true),
    (p_user_id, 'Transportation', '🚗', '#3B82F6', true),
    (p_user_id, 'Shopping', '🛍️', '#8B5CF6', true),
    (p_user_id, 'Bills & Utilities', '💡', '#F59E0B', true),
    (p_user_id, 'Entertainment', '🎬', '#EC4899', true),
    (p_user_id, 'Healthcare', '🏥', '#10B981', true),
    (p_user_id, 'Education', '📚', '#6366F1', true),
    (p_user_id, 'Travel', '✈️', '#06B6D4', true),
    (p_user_id, 'Personal Care', '💅', '#F97316', true),
    (p_user_id, 'Other', '📦', '#6B7280', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_or_create_user to seed default categories
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

    -- Seed default categories for new user
    PERFORM seed_default_categories_for_user(v_user.id);
  END IF;

  RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
