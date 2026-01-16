-- Create income table
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date);
CREATE INDEX IF NOT EXISTS idx_income_is_recurring ON income(is_recurring);
CREATE INDEX IF NOT EXISTS idx_income_user_recurring ON income(user_id, is_recurring);

-- Enable Row Level Security
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Function to get income for a user
CREATE OR REPLACE FUNCTION get_income_for_user(
  p_clerk_user_id TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  amount DECIMAL(12, 2),
  description TEXT,
  date DATE,
  is_recurring BOOLEAN,
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
  SELECT i.id, i.user_id, i.amount, i.description, i.date, i.is_recurring, i.created_at, i.updated_at
  FROM income i
  WHERE i.user_id = v_user_id
    AND (p_start_date IS NULL OR i.date >= p_start_date)
    AND (p_end_date IS NULL OR i.date <= p_end_date)
  ORDER BY i.date DESC, i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total monthly income
CREATE OR REPLACE FUNCTION get_total_monthly_income(
  p_clerk_user_id TEXT,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_user_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_total DECIMAL(12, 2);
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate start and end dates for the month
  v_start_date := DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1));
  v_end_date := (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day')::DATE;

  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM income
  WHERE user_id = v_user_id
    AND date >= v_start_date
    AND date <= v_end_date;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create income
CREATE OR REPLACE FUNCTION create_income(
  p_clerk_user_id TEXT,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_is_recurring BOOLEAN DEFAULT false
)
RETURNS income AS $$
DECLARE
  v_user_id UUID;
  v_income income;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO income (user_id, amount, description, date, is_recurring)
  VALUES (v_user_id, p_amount, p_description, p_date, p_is_recurring)
  RETURNING * INTO v_income;

  RETURN v_income;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update income
CREATE OR REPLACE FUNCTION update_income(
  p_clerk_user_id TEXT,
  p_income_id UUID,
  p_amount DECIMAL(12, 2) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_date DATE DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT NULL
)
RETURNS income AS $$
DECLARE
  v_user_id UUID;
  v_income income;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify income belongs to user
  SELECT * INTO v_income
  FROM income
  WHERE id = p_income_id AND user_id = v_user_id
  LIMIT 1;

  IF v_income IS NULL THEN
    RAISE EXCEPTION 'Income not found or access denied';
  END IF;

  -- Update only provided fields
  UPDATE income
  SET
    amount = COALESCE(p_amount, amount),
    description = COALESCE(p_description, description),
    date = COALESCE(p_date, date),
    is_recurring = COALESCE(p_is_recurring, is_recurring),
    updated_at = NOW()
  WHERE id = p_income_id AND user_id = v_user_id
  RETURNING * INTO v_income;

  RETURN v_income;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete income
CREATE OR REPLACE FUNCTION delete_income(
  p_clerk_user_id TEXT,
  p_income_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_income income;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify income belongs to user
  SELECT * INTO v_income
  FROM income
  WHERE id = p_income_id AND user_id = v_user_id
  LIMIT 1;

  IF v_income IS NULL THEN
    RAISE EXCEPTION 'Income not found or access denied';
  END IF;

  DELETE FROM income
  WHERE id = p_income_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Deny all direct access (only service role can access directly)
-- All operations go through SECURITY DEFINER functions which validate ownership
CREATE POLICY "Income can only be accessed through functions"
  ON income
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
