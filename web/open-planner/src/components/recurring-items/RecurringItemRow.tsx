import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { RecurringItem, RecurringItemFormData } from '../../types/recurring-item'
import type { Category } from '../../types/category'

interface RecurringItemRowProps {
  recurringItem: RecurringItem
  categories: Category[]
  isEditing: boolean
  editData: RecurringItemFormData
  onEdit: (recurringItem: RecurringItem) => void
  onUpdate: (id: string) => void
  onDelete: (id: string) => void
  onCancelEdit: () => void
  onEditDataChange: (data: RecurringItemFormData) => void
  onToggleActive?: (id: string, isActive: boolean) => void
}

export default function RecurringItemRow({
  recurringItem,
  categories,
  isEditing,
  editData,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  onEditDataChange,
  onToggleActive,
}: RecurringItemRowProps) {
  const category = categories.find(c => c.id === recurringItem.category_id)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isEditing) {
    return (
      <Card className="glass border-white/10 mb-3">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Category</label>
              <select
                value={editData.category_id}
                onChange={(e) => onEditDataChange({ ...editData, category_id: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editData.amount}
                onChange={(e) => onEditDataChange({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                className="glass border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Day of Month</label>
              <Input
                type="number"
                step="1"
                min="1"
                max="31"
                value={editData.day_of_month || 1}
                onChange={(e) => onEditDataChange({ ...editData, day_of_month: parseInt(e.target.value) || 1 })}
                className="glass border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Start Date</label>
              <Input
                type="date"
                value={editData.start_date ? (editData.start_date.includes('T') ? editData.start_date.split('T')[0] : editData.start_date) : ''}
                onChange={(e) => onEditDataChange({ ...editData, start_date: e.target.value })}
                className="glass border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Description</label>
              <Input
                type="text"
                value={editData.description || ''}
                onChange={(e) => onEditDataChange({ ...editData, description: e.target.value })}
                className="glass border-white/20 text-white"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onUpdate(recurringItem.id)}
              variant="gradientEmerald"
              size="sm"
              className="flex-1"
            >
              ✓ Save
            </Button>
            <Button
              onClick={onCancelEdit}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`glass border-white/10 mb-3 hover:border-white/20 transition-colors ${!recurringItem.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3 min-w-[200px]">
              {category?.icon && (
                <span className="text-2xl">{category.icon}</span>
              )}
              <div>
                <p className="text-white font-semibold">{category?.name || 'Unknown Category'}</p>
                {recurringItem.description && (
                  <p className="text-slate-400 text-sm">{recurringItem.description}</p>
                )}
                <p className="text-slate-400 text-xs">Day {recurringItem.day_of_month} of each month</p>
              </div>
            </div>
            <div className="text-right min-w-[100px]">
              <p className="text-white font-bold text-lg">{formatCurrency(recurringItem.amount)}</p>
              {!recurringItem.is_active && (
                <p className="text-slate-400 text-xs">Inactive</p>
              )}
            </div>
            <div className="text-slate-400 text-sm min-w-[120px]">
              <p className="text-xs mb-1">Start Date</p>
              <p>{formatDate(recurringItem.start_date)}</p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {onToggleActive && (
              <Button
                onClick={() => onToggleActive(recurringItem.id, !recurringItem.is_active)}
                variant="outline"
                size="sm"
                className={recurringItem.is_active ? 'bg-violet-600/20' : ''}
              >
                {recurringItem.is_active ? 'Active' : 'Inactive'}
              </Button>
            )}
            <Button
              onClick={() => onEdit(recurringItem)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(recurringItem.id)}
              variant="gradientRed"
              size="sm"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
