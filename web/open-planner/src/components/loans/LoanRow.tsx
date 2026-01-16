import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Loan, LoanFormData } from '../../types/loan'

interface LoanRowProps {
  loan: Loan
  isEditing: boolean
  editData: LoanFormData
  onEdit: (loan: Loan) => void
  onUpdate: (id: string) => void
  onDelete: (id: string) => void
  onCancelEdit: () => void
  onEditDataChange: (data: LoanFormData) => void
}

export default function LoanRow({
  loan,
  isEditing,
  editData,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  onEditDataChange,
}: LoanRowProps) {
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

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal: number, rate: number, term: number): number => {
    if (term === 0) return 0
    if (rate === 0) return principal / term

    const monthlyRate = rate / 12
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, term)
    const denominator = Math.pow(1 + monthlyRate, term) - 1

    return principal * (numerator / denominator)
  }

  const monthlyPayment = calculateMonthlyPayment(loan.principal, loan.interest_rate, loan.term_months)

  if (isEditing) {
    return (
      <Card className="glass border-white/10 mb-3">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Principal ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editData.principal}
                onChange={(e) => onEditDataChange({ ...editData, principal: parseFloat(e.target.value) || 0 })}
                className="glass border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Interest Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={editData.interest_rate * 100}
                onChange={(e) => onEditDataChange({ ...editData, interest_rate: parseFloat(e.target.value) / 100 || 0 })}
                className="glass border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Term (Months)</label>
              <Input
                type="number"
                step="1"
                min="1"
                value={editData.term_months}
                onChange={(e) => onEditDataChange({ ...editData, term_months: parseInt(e.target.value) || 1 })}
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
              onClick={() => onUpdate(loan.id)}
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
    <Card className="glass border-white/10 mb-3 hover:border-white/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-2xl">🏦</span>
              <div>
                <p className="text-white font-semibold">{loan.description || 'Loan'}</p>
                <p className="text-slate-400 text-sm">
                  {formatCurrency(loan.principal)} @ {formatPercentage(loan.interest_rate)} for {loan.term_months} months
                </p>
              </div>
            </div>
            <div className="text-right min-w-[120px]">
              <p className="text-slate-400 text-xs">Monthly Payment</p>
              <p className="text-white font-bold text-lg">{formatCurrency(monthlyPayment)}</p>
            </div>
            <div className="text-slate-400 text-sm min-w-[120px]">
              <p className="text-xs mb-1">Start Date</p>
              <p>{formatDate(loan.start_date)}</p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              onClick={() => onEdit(loan)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(loan.id)}
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
