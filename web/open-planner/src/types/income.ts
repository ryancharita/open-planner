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

export interface IncomeFormData {
  amount: number
  description?: string | null
  date?: string
  is_recurring?: boolean
}
