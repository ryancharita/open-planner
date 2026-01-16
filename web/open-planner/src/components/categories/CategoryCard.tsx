import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Category, CategoryFormData } from '../../types/category'

interface CategoryCardProps {
  category: Category
  isEditing: boolean
  editData: CategoryFormData
  onEdit: (category: Category) => void
  onUpdate: (id: string) => void
  onDelete: (id: string, isDefault: boolean) => void
  onCancelEdit: () => void
  onEditDataChange: (data: CategoryFormData) => void
}

export default function CategoryCard({
  category,
  isEditing,
  editData,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  onEditDataChange,
}: CategoryCardProps) {
  if (isEditing) {
    return (
      <Card className="glass border-white/10 card-hover group animate-fadeIn">
        <CardContent className="p-6 space-y-4">
          <Input
            type="text"
            value={editData.name}
            onChange={(e) => onEditDataChange({ ...editData, name: e.target.value })}
            className="glass border-white/20 text-white"
          />
          <Input
            type="text"
            value={editData.icon}
            onChange={(e) => onEditDataChange({ ...editData, icon: e.target.value })}
            className="glass border-white/20 text-white"
            placeholder="Icon emoji"
          />
          <input
            type="color"
            value={editData.color}
            onChange={(e) => onEditDataChange({ ...editData, color: e.target.value })}
            className="w-full h-10 glass border border-white/20 rounded-xl cursor-pointer"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => onUpdate(category.id)}
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
    <Card className="glass border-white/10 card-hover group animate-fadeIn">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {category.icon && (
              <div className="text-3xl group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-white text-lg">{category.name}</h3>
              {category.is_default && (
                <Badge className="mt-1 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  Default
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full mb-4 shadow-lg"
          style={{
            backgroundColor: category.color,
            boxShadow: `0 0 20px ${category.color}40`
          }}
        />
        {!category.is_default && (
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(category)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              onClick={() => onDelete(category.id, category.is_default)}
              variant="gradientRed"
              size="sm"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
