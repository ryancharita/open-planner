import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { CategoryFormData } from '../../types/category'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (category: CategoryFormData) => Promise<void>
  loading: boolean
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  loading
}: CreateCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#3B82F6'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setFormData({ name: '', icon: '', color: '#3B82F6' })
  }

  const handleClose = () => {
    setFormData({ name: '', icon: '', color: '#3B82F6' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="e.g., Food & Dining"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon" className="text-slate-300">Icon (emoji)</Label>
            <Input
              id="icon"
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="glass border-white/20 text-white placeholder-slate-500"
              placeholder="🍽️"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-slate-300">Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-12 glass border border-white/20 rounded-xl cursor-pointer"
              />
              <div className="flex-1 px-4 py-3 glass border border-white/20 rounded-xl">
                <span className="text-white font-mono text-sm">{formData.color}</span>
              </div>
            </div>
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
              disabled={loading}
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
