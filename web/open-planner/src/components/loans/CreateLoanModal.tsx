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
import type { LoanFormData } from '../../types/loan'

interface CreateLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (loan: LoanFormData) => Promise<void>
  loading: boolean
}

export default function CreateLoanModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: CreateLoanModalProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    principal: 0,
    interest_rate: 0,
    term_months: 12,
    start_date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        principal: 0,
        interest_rate: 0,
        term_months: 12,
        start_date: new Date().toISOString().split('T')[0],
        description: '',
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.principal <= 0 || formData.term_months <= 0) {
      return
    }
    await onSubmit(formData)
    setFormData({
      principal: 0,
      interest_rate: 0,
      term_months: 12,
      start_date: new Date().toISOString().split('T')[0],
      description: '',
    })
  }

  const handleClose = () => {
    setFormData({
      principal: 0,
      interest_rate: 0,
      term_months: 12,
      start_date: new Date().toISOString().split('T')[0],
      description: '',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Loan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="principal" className="text-slate-300">Principal Amount ($) *</Label>
            <Input
              id="principal"
              type="number"
              step="0.01"
              min="0"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest_rate" className="text-slate-300">Annual Interest Rate (%) *</Label>
            <Input
              id="interest_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.interest_rate * 100}
              onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) / 100 || 0 })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-slate-400">Enter as percentage (e.g., 5.5 for 5.5%)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term_months" className="text-slate-300">Term (Months) *</Label>
            <Input
              id="term_months"
              type="number"
              step="1"
              min="1"
              value={formData.term_months}
              onChange={(e) => setFormData({ ...formData, term_months: parseInt(e.target.value) || 1 })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-slate-300">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
              disabled={loading || formData.principal <= 0 || formData.term_months <= 0}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                '✓ Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
