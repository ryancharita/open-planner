-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  principal DECIMAL(12, 2) NOT NULL CHECK (principal > 0),
  interest_rate DECIMAL(5, 4) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 1),
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_start_date ON loans(start_date);
CREATE INDEX IF NOT EXISTS idx_loans_user_start_date ON loans(user_id, start_date);

-- Enable Row Level Security
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Function to get loans for a user
CREATE OR REPLACE FUNCTION get_loans_for_user(
  p_clerk_user_id TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  principal DECIMAL(12, 2),
  interest_rate DECIMAL(5, 4),
  term_months INTEGER,
  start_date DATE,
  description TEXT,
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
  SELECT l.id, l.user_id, l.principal, l.interest_rate, l.term_months, l.start_date, l.description, l.created_at, l.updated_at
  FROM loans l
  WHERE l.user_id = v_user_id
  ORDER BY l.start_date DESC, l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a loan
CREATE OR REPLACE FUNCTION create_loan(
  p_clerk_user_id TEXT,
  p_principal DECIMAL(12, 2),
  p_interest_rate DECIMAL(5, 4),
  p_term_months INTEGER,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL
)
RETURNS loans AS $$
DECLARE
  v_user_id UUID;
  v_loan loans;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO loans (user_id, principal, interest_rate, term_months, start_date, description)
  VALUES (v_user_id, p_principal, p_interest_rate, p_term_months, p_start_date, p_description)
  RETURNING * INTO v_loan;

  RETURN v_loan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a loan
CREATE OR REPLACE FUNCTION update_loan(
  p_clerk_user_id TEXT,
  p_loan_id UUID,
  p_principal DECIMAL(12, 2) DEFAULT NULL,
  p_interest_rate DECIMAL(5, 4) DEFAULT NULL,
  p_term_months INTEGER DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS loans AS $$
DECLARE
  v_user_id UUID;
  v_loan loans;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify loan belongs to user
  SELECT * INTO v_loan
  FROM loans
  WHERE id = p_loan_id AND user_id = v_user_id
  LIMIT 1;

  IF v_loan IS NULL THEN
    RAISE EXCEPTION 'Loan not found or access denied';
  END IF;

  -- Update only provided fields
  UPDATE loans
  SET
    principal = COALESCE(p_principal, principal),
    interest_rate = COALESCE(p_interest_rate, interest_rate),
    term_months = COALESCE(p_term_months, term_months),
    start_date = COALESCE(p_start_date, start_date),
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_loan_id AND user_id = v_user_id
  RETURNING * INTO v_loan;

  RETURN v_loan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a loan
CREATE OR REPLACE FUNCTION delete_loan(
  p_clerk_user_id TEXT,
  p_loan_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_loan loans;
BEGIN
  v_user_id := get_user_id_from_clerk(p_clerk_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify loan belongs to user
  SELECT * INTO v_loan
  FROM loans
  WHERE id = p_loan_id AND user_id = v_user_id
  LIMIT 1;

  IF v_loan IS NULL THEN
    RAISE EXCEPTION 'Loan not found or access denied';
  END IF;

  DELETE FROM loans
  WHERE id = p_loan_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Deny all direct access (only service role can access directly)
-- All operations go through SECURITY DEFINER functions which validate ownership
CREATE POLICY "Loans can only be accessed through functions"
  ON loans
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
