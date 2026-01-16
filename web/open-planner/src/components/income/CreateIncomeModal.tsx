import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { IncomeFormData } from '../../types/income';

interface CreateIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (income: IncomeFormData) => Promise<void>;
  loading: boolean;
  editingIncome?: { id: string; data: IncomeFormData } | null;
}

export default function CreateIncomeModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingIncome,
}: CreateIncomeModalProps) {
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
  });

  useEffect(() => {
    if (editingIncome) {
      setFormData(editingIncome.data);
    } else {
      setFormData({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
      });
    }
  }, [editingIncome, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      return;
    }
    await onSubmit(formData);
    if (!editingIncome) {
      setFormData({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
      });
    }
  };

  const handleClose = () => {
    if (!editingIncome) {
      setFormData({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingIncome ? 'Edit Income' : 'Create New Income'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring || false}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
              />
              <Label htmlFor="is_recurring" className="text-slate-300 cursor-pointer">
                Recurring Income
              </Label>
            </div>
            <p className="text-xs text-slate-400 ml-8">
              Mark this income as recurring (e.g., salary, monthly payments)
            </p>
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
              disabled={loading || formData.amount <= 0}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingIncome ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                editingIncome ? '✓ Update' : '✓ Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
