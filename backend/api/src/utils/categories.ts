import { SupabaseClient } from '@supabase/supabase-js'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string | null
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryInput {
  name: string
  icon?: string | null
  color?: string
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string | null
  color?: string
}

/**
 * Get all categories for a user
 */
export async function getCategories(
  supabaseService: SupabaseClient,
  clerkUserId: string
): Promise<Category[]> {
  const { data, error } = await supabaseService.rpc('get_categories_for_user', {
    p_clerk_user_id: clerkUserId,
  })

  if (error) {
    throw new Error(`Failed to get categories: ${error.message}`)
  }

  return (data || []) as Category[]
}

/**
 * Create a new category
 */
export async function createCategory(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  input: CreateCategoryInput
): Promise<Category> {
  const { data, error } = await supabaseService.rpc('create_category', {
    p_clerk_user_id: clerkUserId,
    p_name: input.name,
    p_icon: input.icon || null,
    p_color: input.color || '#3B82F6',
  })

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }

  return data as Category
}

/**
 * Update a category
 */
export async function updateCategory(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<Category> {
  const { data, error } = await supabaseService.rpc('update_category', {
    p_clerk_user_id: clerkUserId,
    p_category_id: categoryId,
    p_name: input.name || null,
    p_icon: input.icon !== undefined ? input.icon : null,
    p_color: input.color || null,
  })

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`)
  }

  return data as Category
}

/**
 * Delete a category
 */
export async function deleteCategory(
  supabaseService: SupabaseClient,
  clerkUserId: string,
  categoryId: string
): Promise<boolean> {
  const { data, error } = await supabaseService.rpc('delete_category', {
    p_clerk_user_id: clerkUserId,
    p_category_id: categoryId,
  })

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`)
  }

  return data === true
}
