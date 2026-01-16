import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ExpenseFormData } from '../../types/expense'
import type { Category } from '../../types/category'

interface CreateExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (expense: ExpenseFormData) => Promise<void>
  loading: boolean
  categories: Category[]
  editingExpense?: { id: string; data: ExpenseFormData } | null
}

export default function CreateExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  categories,
  editingExpense,
}: CreateExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category_id: categories[0]?.id || '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (editingExpense) {
      setFormData(editingExpense.data)
    } else {
      setFormData({
        category_id: categories[0]?.id || '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [editingExpense, categories, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category_id || formData.amount <= 0) {
      return
    }
    await onSubmit(formData)
    if (!editingExpense) {
      setFormData({
        category_id: categories[0]?.id || '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }

  const handleClose = () => {
    if (!editingExpense) {
      setFormData({
        category_id: categories[0]?.id || '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingExpense ? 'Edit Expense' : 'Create New Expense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category_id" className="text-slate-300">Category *</Label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900">
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-300">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-slate-300">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="glass border-white/20 text-white placeholder-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Input
              id="description"
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradientEmerald"
              disabled={loading || !formData.category_id || formData.amount <= 0}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingExpense ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                editingExpense ? '✓ Update' : '✓ Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
