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

export interface RecurringItemFormData {
  category_id: string
  amount: number
  description?: string | null
  day_of_month?: number
  start_date?: string
}
