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

export interface CategoryFormData {
  name: string
  icon: string
  color: string
}
