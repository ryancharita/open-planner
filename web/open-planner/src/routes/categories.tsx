import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Components
import CreateCategoryModal from '../components/categories/CreateCategoryModal';
import CategoryCard from '../components/categories/CategoryCard';
import CategoryEmptyState from '../components/categories/CategoryEmptyState';
import CategoryLoadingState from '../components/categories/CategoryLoadingState';
import ErrorMessage from '../components/categories/ErrorMessage';

// Types
import type { Category, CategoryFormData } from '../types/category';

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { getToken, isSignedIn } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState({ name: '', icon: '', color: '' });

  const fetchCategories = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('import.meta.env.VITE_API_UPL/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleCreate = async (categoryData: CategoryFormData) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('import.meta.env.VITE_API_UPL/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryData.name,
          icon: categoryData.icon || null,
          color: categoryData.color,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

      setShowCreateModal(false);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategory.name || undefined,
          icon: editCategory.icon || null,
          color: editCategory.color || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }

      setEditingId(null);
      setEditCategory({ name: '', icon: '', color: '' });
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (!isSignedIn) return;
    if (isDefault) {
      setError('Cannot delete default category');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    if (category.is_default) {
      setError('Cannot edit default category');
      return;
    }
    setEditingId(category.id);
    setEditCategory({
      name: category.name,
      icon: category.icon || '',
      color: category.color,
    });
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-8 flex items-center justify-center">
        <Card className="glass border-white/10 max-w-md">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-slate-400">Please sign in to view and manage your categories</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              <span className="gradient-text">Categories</span>
            </h1>
            <p className="text-slate-400">Organize your expenses with custom categories</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30"
          >
            + New Category
          </Button>
        </div>

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Category Modal */}
        <CreateCategoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
        />

        {/* Categories Grid */}
        {loading && !categories.length ? (
          <CategoryLoadingState />
        ) : categories.length === 0 ? (
          <CategoryEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isEditing={editingId === category.id}
                editData={editCategory}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCancelEdit={() => setEditingId(null)}
                onEditDataChange={setEditCategory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
