import { SupabaseClient } from '@supabase/supabase-js'

export interface Income {
  id: string
  user_id: string
  amount: number
  description: string | null
  date: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export interface CreateIncomeInput {
  amount: number
  description?: string | null
  date?: string
  is_recurring?: boolean
}

export interface UpdateIncomeInput {
  amount?: number
  description?: string | null
  date?: string
  is_recurring?: boolean
}

/**
 * Get all income for a user, optionally filtered by date range
 */
export async function getIncome(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  startDate?: string,
  endDate?: string
): Promise<Income[]> {
  const { data, error } = await supabaseService.rpc('get_income_for_user', {
    p_clerk_user_id: clerkUserId,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  })

  if (error) {
    throw new Error(`Failed to get income: ${error.message}`)
  }

  return (data || []) as Income[]
}

/**
 * Get total monthly income
 */
export async function getTotalMonthlyIncome(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  year: number,
  month: number
): Promise<number> {
  const { data, error } = await supabaseService.rpc('get_total_monthly_income', {
    p_clerk_user_id: clerkUserId,
    p_year: year,
    p_month: month,
  })

  if (error) {
    throw new Error(`Failed to get total monthly income: ${error.message}`)
  }

  return parseFloat(data || '0')
}

/**
 * Create a new income entry
 */
export async function createIncome(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  input: CreateIncomeInput
): Promise<Income> {
  const { data, error } = await supabaseService.rpc('create_income', {
    p_clerk_user_id: clerkUserId,
    p_amount: input.amount,
    p_description: input.description || null,
    p_date: input.date || null,
    p_is_recurring: input.is_recurring || false,
  })

  if (error) {
    throw new Error(`Failed to create income: ${error.message}`)
  }

  return data as Income
}

/**
 * Update an income entry
 */
export async function updateIncome(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  incomeId: string,
  input: UpdateIncomeInput
): Promise<Income> {
  const { data, error } = await supabaseService.rpc('update_income', {
    p_clerk_user_id: clerkUserId,
    p_income_id: incomeId,
    p_amount: input.amount || null,
    p_description: input.description !== undefined ? input.description : null,
    p_date: input.date || null,
    p_is_recurring: input.is_recurring !== undefined ? input.is_recurring : null,
  })

  if (error) {
    throw new Error(`Failed to update income: ${error.message}`)
  }

  return data as Income
}

/**
 * Delete an income entry
 */
export async function deleteIncome(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  incomeId: string
): Promise<boolean> {
  const { data, error } = await supabaseService.rpc('delete_income', {
    p_clerk_user_id: clerkUserId,
    p_income_id: incomeId,
  })

  if (error) {
    throw new Error(`Failed to delete income: ${error.message}`)
  }

  return data === true
}
