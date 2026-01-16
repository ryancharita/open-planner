import { SupabaseClient } from '@supabase/supabase-js'

export interface Loan {
  id: string
  user_id: string
  principal: number
  interest_rate: number
  term_months: number
  start_date: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreateLoanInput {
  principal: number
  interest_rate: number
  term_months: number
  start_date?: string
  description?: string | null
}

export interface UpdateLoanInput {
  principal?: number
  interest_rate?: number
  term_months?: number
  start_date?: string
  description?: string | null
}

/**
 * Get all loans for a user
 */
export async function getLoans(
  supabaseService: SupabaseClient,
  clerkUserId: string
): Promise<Loan[]> {
  const { data, error } = await supabaseService.rpc('get_loans_for_user', {
    p_clerk_user_id: clerkUserId,
  })

  if (error) {
    throw new Error(`Failed to get loans: ${error.message}`)
  }

  return (data || []) as Loan[]
}

/**
 * Create a new loan
 */
export async function createLoan(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  input: CreateLoanInput
): Promise<Loan> {
  const { data, error } = await supabaseService.rpc('create_loan', {
    p_clerk_user_id: clerkUserId,
    p_principal: input.principal,
    p_interest_rate: input.interest_rate,
    p_term_months: input.term_months,
    p_start_date: input.start_date || null,
    p_description: input.description || null,
  })

  if (error) {
    throw new Error(`Failed to create loan: ${error.message}`)
  }

  return data as Loan
}

/**
 * Update a loan
 */
export async function updateLoan(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  loanId: string,
  input: UpdateLoanInput
): Promise<Loan> {
  const { data, error } = await supabaseService.rpc('update_loan', {
    p_clerk_user_id: clerkUserId,
    p_loan_id: loanId,
    p_principal: input.principal || null,
    p_interest_rate: input.interest_rate !== undefined ? input.interest_rate : null,
    p_term_months: input.term_months || null,
    p_start_date: input.start_date || null,
    p_description: input.description !== undefined ? input.description : null,
  })

  if (error) {
    throw new Error(`Failed to update loan: ${error.message}`)
  }

  return data as Loan
}

/**
 * Delete a loan
 */
export async function deleteLoan(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  loanId: string
): Promise<boolean> {
  const { data, error } = await supabaseService.rpc('delete_loan', {
    p_clerk_user_id: clerkUserId,
    p_loan_id: loanId,
  })

  if (error) {
    throw new Error(`Failed to delete loan: ${error.message}`)
  }

  return data === true
}

/**
 * Calculate monthly payment for a loan using amortization formula
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * - M = monthly payment
 * - P = principal
 * - r = monthly interest rate (annual rate / 12)
 * - n = number of payments (term_months)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number {
  if (termMonths === 0) return 0
  if (annualInterestRate === 0) return principal / termMonths

  const monthlyRate = annualInterestRate / 12
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths)
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1

  return principal * (numerator / denominator)
}

/**
 * Calculate total monthly loan obligations for all active loans
 */
export function calculateTotalLoanObligations(loans: Loan[]): number {
  return loans.reduce((total, loan) => {
    // Check if loan is still active (hasn't exceeded term)
    const startDate = new Date(loan.start_date)
    const now = new Date()
    const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 +
                             (now.getMonth() - startDate.getMonth())

    // Only include loans that haven't exceeded their term
    if (monthsSinceStart < loan.term_months) {
      const monthlyPayment = calculateMonthlyPayment(
        loan.principal,
        loan.interest_rate, // Already stored as decimal (0.05 = 5%)
        loan.term_months
      )
      return total + monthlyPayment
    }

    return total
  }, 0)
}
