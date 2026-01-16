import { SupabaseClient } from '@supabase/supabase-js'

export interface User {
  id: string
  clerk_user_id: string
  currency: string
  created_at: string
  updated_at: string
}

/**
 * Get or create a user in Supabase
 * Uses the service role client to call the get_or_create_user database function
 */
export async function getOrCreateUser(
  supabaseService: SupabaseClient,
  clerkUserId: string
): Promise<User> {
  const { data, error } = await supabaseService.rpc('get_or_create_user', {
    p_clerk_user_id: clerkUserId,
  })

  if (error) {
    throw new Error(`Failed to get or create user: ${error.message}`)
  }

  return data as User
}

/**
 * Get user by clerk_user_id
 * Uses database function that validates ownership
 */
export async function getUserByClerkId(
  supabaseService: SupabaseClient,
  clerkUserId: string
): Promise<User | null> {
  const { data, error } = await supabaseService.rpc('get_user_by_clerk_id', {
    p_clerk_user_id: clerkUserId,
  })

  if (error) {
    if (error.code === 'P0001') {
      // User not found (raised by function)
      return null
    }
    throw new Error(`Failed to get user: ${error.message}`)
  }

  return data as User
}

/**
 * Update user currency
 * Uses database function that validates ownership via clerk_user_id
 */
export async function updateUserCurrency(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  currency: string
): Promise<User> {
  const { data, error } = await supabaseService.rpc('update_user_currency', {
    p_clerk_user_id: clerkUserId,
    p_currency: currency,
  })

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  return data as User
}
