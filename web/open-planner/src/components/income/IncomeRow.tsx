import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Income, IncomeFormData } from '../../types/income';

interface IncomeRowProps {
  income: Income;
  isEditing: boolean;
  editData: IncomeFormData;
  onEdit: (income: Income) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  onEditDataChange: (data: IncomeFormData) => void;
}

export default function IncomeRow({
  income,
  isEditing,
  editData,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  onEditDataChange,
}: IncomeRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <Card className="glass border-white/10 mb-3">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-xs text-slate-400">Date</label>
              <Input
                type="date"
                value={editData.date || ''}
                onChange={(e) => onEditDataChange({ ...editData, date: e.target.value })}
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
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Recurring</label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={editData.is_recurring || false}
                  onChange={(e) => onEditDataChange({ ...editData, is_recurring: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-slate-300">Recurring</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onUpdate(income.id)}
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
    );
  }

  return (
    <Card className="glass border-white/10 mb-3 hover:border-white/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">{formatCurrency(income.amount)}</p>
                  {income.is_recurring && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      Recurring
                    </Badge>
                  )}
                </div>
                {income.description && (
                  <p className="text-slate-400 text-sm">{income.description}</p>
                )}
              </div>
            </div>
            <div className="text-slate-400 text-sm min-w-[120px]">
              {formatDate(income.date)}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              onClick={() => onEdit(income)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(income.id)}
              variant="gradientRed"
              size="sm"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
