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

export interface LoanFormData {
  principal: number
  interest_rate: number
  term_months: number
  start_date?: string
  description?: string | null
}
