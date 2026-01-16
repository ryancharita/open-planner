import { SupabaseClient } from '@supabase/supabase-js'

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface MonthlyExpenseByCategory {
  category_id: string
  category_name: string
  category_icon: string | null
  category_color: string
  total_amount: number
  expense_count: number
}

export interface CreateExpenseInput {
  category_id: string
  amount: number
  description?: string | null
  date?: string
}

export interface UpdateExpenseInput {
  category_id?: string
  amount?: number
  description?: string | null
  date?: string
}

/**
 * Get all expenses for a user, optionally filtered by date range
 */
export async function getExpenses(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  startDate?: string,
  endDate?: string
): Promise<Expense[]> {
  const { data, error } = await supabaseService.rpc('get_expenses_for_user', {
    p_clerk_user_id: clerkUserId,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  })

  if (error) {
    throw new Error(`Failed to get expenses: ${error.message}`)
  }

  return (data || []) as Expense[]
}

/**
 * Get monthly expenses grouped by category
 */
export async function getMonthlyExpensesByCategory(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  year: number,
  month: number
): Promise<MonthlyExpenseByCategory[]> {
  const { data, error } = await supabaseService.rpc('get_monthly_expenses_by_category', {
    p_clerk_user_id: clerkUserId,
    p_year: year,
    p_month: month,
  })

  if (error) {
    throw new Error(`Failed to get monthly expenses: ${error.message}`)
  }

  return (data || []) as MonthlyExpenseByCategory[]
}

/**
 * Get total monthly spend
 */
export async function getTotalMonthlySpend(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  year: number,
  month: number
): Promise<number> {
  const { data, error } = await supabaseService.rpc('get_total_monthly_spend', {
    p_clerk_user_id: clerkUserId,
    p_year: year,
    p_month: month,
  })

  if (error) {
    throw new Error(`Failed to get total monthly spend: ${error.message}`)
  }

  return parseFloat(data || '0')
}

/**
 * Create a new expense
 */
export async function createExpense(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  input: CreateExpenseInput
): Promise<Expense> {
  const { data, error } = await supabaseService.rpc('create_expense', {
    p_clerk_user_id: clerkUserId,
    p_category_id: input.category_id,
    p_amount: input.amount,
    p_description: input.description || null,
    p_date: input.date || null,
  })

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`)
  }

  return data as Expense
}

/**
 * Update an expense
 */
export async function updateExpense(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const { data, error } = await supabaseService.rpc('update_expense', {
    p_clerk_user_id: clerkUserId,
    p_expense_id: expenseId,
    p_category_id: input.category_id || null,
    p_amount: input.amount || null,
    p_description: input.description !== undefined ? input.description : null,
    p_date: input.date || null,
  })

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`)
  }

  return data as Expense
}

/**
 * Delete an expense
 */
export async function deleteExpense(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  expenseId: string
): Promise<boolean> {
  const { data, error } = await supabaseService.rpc('delete_expense', {
    p_clerk_user_id: clerkUserId,
    p_expense_id: expenseId,
  })

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`)
  }

  return data === true
}
