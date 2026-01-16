-- Create recurring_items table
CREATE TABLE IF NOT EXISTS recurring_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_generated_month DATE, -- Tracks the last month (year-month) that was generated
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_items_user_id ON recurring_items(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_items_category_id ON recurring_items(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_items_user_active ON recurring_items(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_items_start_date ON recurring_items(start_date);

-- Enable Row Level Security
ALTER TABLE recurring_items ENABLE ROW LEVEL SECURITY;

-- Function to get recurring items for a user
CREATE OR REPLACE FUNCTION get_recurring_items_for_user(
  p_clerk_user_id TEXT,
  p_active_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  amount DECIMAL(12, 2),
  description TEXT,
  day_of_month INTEGER,
  start_date DATE,
  last_generated_month DATE,
  is_active BOOLEAN,
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
  SELECT
    ri.id, ri.user_id, ri.category_id, ri.amount, ri.description,
    ri.day_of_month, ri.start_date, ri.last_generated_month,
    ri.is_active, ri.created_at, ri.updated_at
  FROM recurring_items ri
  WHERE ri.user_id = v_user_id
    AND (NOT p_active_only OR ri.is_active = true)
  ORDER BY ri.day_of_month ASC, ri.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a recurring item
CREATE OR REPLACE FUNCTION create_recurring_item(
  p_clerk_user_id TEXT,
  p_category_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT 1,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS recurring_items AS $$
DECLARE
  v_user_id UUID;
  v_recurring_item recurring_items;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify category belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM categories
    WHERE id = p_category_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Category not found or access denied';
  END IF;

  INSERT INTO recurring_items (user_id, category_id, amount, description, day_of_month, start_date)
  VALUES (v_user_id, p_category_id, p_amount, p_description, p_day_of_month, p_start_date)
  RETURNING * INTO v_recurring_item;

  RETURN v_recurring_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a recurring item
CREATE OR REPLACE FUNCTION update_recurring_item(
  p_clerk_user_id TEXT,
  p_recurring_item_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_amount DECIMAL(12, 2) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS recurring_items AS $$
DECLARE
  v_user_id UUID;
  v_recurring_item recurring_items;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify recurring item belongs to user
  SELECT * INTO v_recurring_item
  FROM recurring_items
  WHERE id = p_recurring_item_id AND user_id = v_user_id
  LIMIT 1;

  IF v_recurring_item IS NULL THEN
    RAISE EXCEPTION 'Recurring item not found or access denied';
  END IF;

  -- If category_id is provided, verify it belongs to user
  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM categories
      WHERE id = p_category_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Category not found or access denied';
    END IF;
  END IF;

  -- Update only provided fields
  UPDATE recurring_items
  SET
    category_id = COALESCE(p_category_id, category_id),
    amount = COALESCE(p_amount, amount),
    description = COALESCE(p_description, description),
    day_of_month = COALESCE(p_day_of_month, day_of_month),
    start_date = COALESCE(p_start_date, start_date),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_recurring_item_id AND user_id = v_user_id
  RETURNING * INTO v_recurring_item;

  RETURN v_recurring_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a recurring item
CREATE OR REPLACE FUNCTION delete_recurring_item(
  p_clerk_user_id TEXT,
  p_recurring_item_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_recurring_item recurring_items;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify recurring item belongs to user
  SELECT * INTO v_recurring_item
  FROM recurring_items
  WHERE id = p_recurring_item_id AND user_id = v_user_id
  LIMIT 1;

  IF v_recurring_item IS NULL THEN
    RAISE EXCEPTION 'Recurring item not found or access denied';
  END IF;

  DELETE FROM recurring_items
  WHERE id = p_recurring_item_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate expenses from recurring items for the current month
-- This prevents duplicates by checking last_generated_month
CREATE OR REPLACE FUNCTION generate_recurring_expenses(
  p_clerk_user_id TEXT,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  generated_count INTEGER,
  skipped_count INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_target_year INTEGER;
  v_target_month INTEGER;
  v_target_date DATE;
  v_first_of_month DATE;
  v_last_of_month DATE;
  v_generated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_recurring_item RECORD;
  v_expense_date DATE;
  v_month_key DATE; -- First day of the target month for tracking
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Determine target month (default to current month)
  IF p_year IS NULL OR p_month IS NULL THEN
    v_target_year := EXTRACT(YEAR FROM CURRENT_DATE);
    v_target_month := EXTRACT(MONTH FROM CURRENT_DATE);
  ELSE
    v_target_year := p_year;
    v_target_month := p_month;
  END IF;

  -- Calculate month boundaries
  v_first_of_month := DATE_TRUNC('month', MAKE_DATE(v_target_year, v_target_month, 1));
  v_last_of_month := (v_first_of_month + INTERVAL '1 month - 1 day')::DATE;
  v_month_key := v_first_of_month; -- Use first day of month as key for tracking

  -- Loop through all active recurring items for this user
  FOR v_recurring_item IN
    SELECT * FROM recurring_items
    WHERE user_id = v_user_id
      AND is_active = true
      AND start_date <= v_last_of_month
  LOOP
    -- Check if we've already generated for this month
    IF v_recurring_item.last_generated_month IS NOT NULL
       AND DATE_TRUNC('month', v_recurring_item.last_generated_month) = v_month_key THEN
      -- Already generated for this month, skip
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Calculate the expense date (day_of_month within the target month)
    -- Handle edge case where day_of_month doesn't exist in the month (e.g., Feb 30)
    v_expense_date := LEAST(
      MAKE_DATE(v_target_year, v_target_month, v_recurring_item.day_of_month),
      v_last_of_month
    );

    -- Only generate if the expense date is within the target month
    IF v_expense_date >= v_first_of_month AND v_expense_date <= v_last_of_month THEN
      -- Create the expense
      INSERT INTO expenses (user_id, category_id, amount, description, date)
      VALUES (
        v_user_id,
        v_recurring_item.category_id,
        v_recurring_item.amount,
        COALESCE(v_recurring_item.description, 'Recurring expense'),
        v_expense_date
      );

      -- Update last_generated_month to track that we've generated for this month
      UPDATE recurring_items
      SET last_generated_month = v_month_key,
          updated_at = NOW()
      WHERE id = v_recurring_item.id;

      v_generated_count := v_generated_count + 1;
    ELSE
      v_skipped_count := v_skipped_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_generated_count, v_skipped_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Deny all direct access (only service role can access directly)
-- All operations go through SECURITY DEFINER functions which validate ownership
CREATE POLICY "Recurring items can only be accessed through functions"
  ON recurring_items
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_recurring_items_updated_at
  BEFORE UPDATE ON recurring_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
