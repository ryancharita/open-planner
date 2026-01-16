import { SupabaseClient } from '@supabase/supabase-js'

export interface RecurringItem {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string | null
  day_of_month: number
  start_date: string
  last_generated_month: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRecurringItemInput {
  category_id: string
  amount: number
  description?: string | null
  day_of_month?: number
  start_date?: string
}

export interface UpdateRecurringItemInput {
  category_id?: string
  amount?: number
  description?: string | null
  day_of_month?: number
  start_date?: string
  is_active?: boolean
}

export interface GenerateResult {
  generated_count: number
  skipped_count: number
}

/**
 * Get all recurring items for a user
 */
export async function getRecurringItems(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  activeOnly: boolean = false
): Promise<RecurringItem[]> {
  const { data, error } = await supabaseService.rpc('get_recurring_items_for_user', {
    p_clerk_user_id: clerkUserId,
    p_active_only: activeOnly,
  })

  if (error) {
    throw new Error(`Failed to get recurring items: ${error.message}`)
  }

  return (data || []) as RecurringItem[]
}

/**
 * Create a new recurring item
 */
export async function createRecurringItem(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  input: CreateRecurringItemInput
): Promise<RecurringItem> {
  const { data, error } = await supabaseService.rpc('create_recurring_item', {
    p_clerk_user_id: clerkUserId,
    p_category_id: input.category_id,
    p_amount: input.amount,
    p_description: input.description || null,
    p_day_of_month: input.day_of_month || 1,
    p_start_date: input.start_date || null,
  })

  if (error) {
    throw new Error(`Failed to create recurring item: ${error.message}`)
  }

  return data as RecurringItem
}

/**
 * Update a recurring item
 */
export async function updateRecurringItem(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  recurringItemId: string,
  input: UpdateRecurringItemInput
): Promise<RecurringItem> {
  const { data, error } = await supabaseService.rpc('update_recurring_item', {
    p_clerk_user_id: clerkUserId,
    p_recurring_item_id: recurringItemId,
    p_category_id: input.category_id || null,
    p_amount: input.amount || null,
    p_description: input.description !== undefined ? input.description : null,
    p_day_of_month: input.day_of_month || null,
    p_start_date: input.start_date || null,
    p_is_active: input.is_active !== undefined ? input.is_active : null,
  })

  if (error) {
    throw new Error(`Failed to update recurring item: ${error.message}`)
  }

  return data as RecurringItem
}

/**
 * Delete a recurring item
 */
export async function deleteRecurringItem(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  recurringItemId: string
): Promise<boolean> {
  const { data, error } = await supabaseService.rpc('delete_recurring_item', {
    p_clerk_user_id: clerkUserId,
    p_recurring_item_id: recurringItemId,
  })

  if (error) {
    throw new Error(`Failed to delete recurring item: ${error.message}`)
  }

  return data === true
}

/**
 * Generate expenses from recurring items for a specific month
 * Prevents duplicates by tracking last_generated_month
 */
export async function generateRecurringExpenses(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  year?: number,
  month?: number
): Promise<GenerateResult> {
  const { data, error } = await supabaseService.rpc('generate_recurring_expenses', {
    p_clerk_user_id: clerkUserId,
    p_year: year || null,
    p_month: month || null,
  })

  if (error) {
    throw new Error(`Failed to generate recurring expenses: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return { generated_count: 0, skipped_count: 0 }
  }

  return data[0] as GenerateResult
}
