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

export interface ExpenseFormData {
  category_id: string
  amount: number
  description?: string | null
  date?: string
}
