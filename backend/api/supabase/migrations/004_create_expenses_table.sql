-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category_date ON expenses(user_id, category_id, date);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Function to get expenses for a user
CREATE OR REPLACE FUNCTION get_expenses_for_user(
  p_clerk_user_id TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  amount DECIMAL(12, 2),
  description TEXT,
  date DATE,
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
  SELECT e.id, e.user_id, e.category_id, e.amount, e.description, e.date, e.created_at, e.updated_at
  FROM expenses e
  WHERE e.user_id = v_user_id
    AND (p_start_date IS NULL OR e.date >= p_start_date)
    AND (p_end_date IS NULL OR e.date <= p_end_date)
  ORDER BY e.date DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly expenses grouped by category
CREATE OR REPLACE FUNCTION get_monthly_expenses_by_category(
  p_clerk_user_id TEXT,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  total_amount DECIMAL(12, 2),
  expense_count BIGINT
) AS $$
DECLARE
  v_user_id UUID;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate start and end dates for the month
  v_start_date := DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1));
  v_end_date := (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day')::DATE;

  RETURN QUERY
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    COALESCE(SUM(e.amount), 0) AS total_amount,
    COUNT(e.id) AS expense_count
  FROM categories c
  LEFT JOIN expenses e ON e.category_id = c.id
    AND e.user_id = v_user_id
    AND e.date >= v_start_date
    AND e.date <= v_end_date
  WHERE c.user_id = v_user_id
  GROUP BY c.id, c.name, c.icon, c.color
  HAVING COUNT(e.id) > 0
  ORDER BY total_amount DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total monthly spend
CREATE OR REPLACE FUNCTION get_total_monthly_spend(
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
  FROM expenses
  WHERE user_id = v_user_id
    AND date >= v_start_date
    AND date <= v_end_date;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an expense
CREATE OR REPLACE FUNCTION create_expense(
  p_clerk_user_id TEXT,
  p_category_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS expenses AS $$
DECLARE
  v_user_id UUID;
  v_expense expenses;
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

  INSERT INTO expenses (user_id, category_id, amount, description, date)
  VALUES (v_user_id, p_category_id, p_amount, p_description, p_date)
  RETURNING * INTO v_expense;

  RETURN v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an expense
CREATE OR REPLACE FUNCTION update_expense(
  p_clerk_user_id TEXT,
  p_expense_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_amount DECIMAL(12, 2) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_date DATE DEFAULT NULL
)
RETURNS expenses AS $$
DECLARE
  v_user_id UUID;
  v_expense expenses;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify expense belongs to user
  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND user_id = v_user_id
  LIMIT 1;

  IF v_expense IS NULL THEN
    RAISE EXCEPTION 'Expense not found or access denied';
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
  UPDATE expenses
  SET
    category_id = COALESCE(p_category_id, category_id),
    amount = COALESCE(p_amount, amount),
    description = COALESCE(p_description, description),
    date = COALESCE(p_date, date),
    updated_at = NOW()
  WHERE id = p_expense_id AND user_id = v_user_id
  RETURNING * INTO v_expense;

  RETURN v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete an expense
CREATE OR REPLACE FUNCTION delete_expense(
  p_clerk_user_id TEXT,
  p_expense_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_expense expenses;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify expense belongs to user
  SELECT * INTO v_expense
  FROM expenses
  WHERE id = p_expense_id AND user_id = v_user_id
  LIMIT 1;

  IF v_expense IS NULL THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;

  DELETE FROM expenses
  WHERE id = p_expense_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Deny all direct access (only service role can access directly)
-- All operations go through SECURITY DEFINER functions which validate ownership
CREATE POLICY "Expenses can only be accessed through functions"
  ON expenses
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
