import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Components
import {
  RecurringItemRow,
  CreateRecurringItemModal,
  RecurringItemEmptyState,
  RecurringItemLoadingState,
  ErrorMessage,
} from '../components/recurring-items';

// Types
import type { RecurringItem, RecurringItemFormData } from '../types/recurring-item';
import type { Category } from '../types/category';

export const Route = createFileRoute('/recurring-items')({
  component: RecurringItemsPage,
});

function RecurringItemsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRecurringItem, setEditRecurringItem] = useState<RecurringItemFormData | null>(null);

  const fetchCategories = async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + '/api/categories', {
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
      console.error('Error fetching categories:', err);
    }
  };

  const fetchRecurringItems = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + '/api/recurring-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recurring items');
      }

      const data = await response.json();
      setRecurringItems(data.recurringItems || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCategories();
      fetchRecurringItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleCreate = async (recurringItemData: RecurringItemFormData) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + '/api/recurring-items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recurringItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recurring item');
      }

      setShowCreateModal(false);
      await fetchRecurringItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isSignedIn || !editRecurringItem) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/recurring-items/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editRecurringItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recurring item');
      }

      setEditingId(null);
      setEditRecurringItem(null);
      await fetchRecurringItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn) return;

    if (!confirm('Are you sure you want to delete this recurring item?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/recurring-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recurring item');
      }

      await fetchRecurringItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/recurring-items/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recurring item');
      }

      await fetchRecurringItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (recurringItem: RecurringItem) => {
    setEditingId(recurringItem.id);
    const dateValue = recurringItem.start_date.includes('T')
      ? recurringItem.start_date.split('T')[0]
      : recurringItem.start_date;
    setEditRecurringItem({
      category_id: recurringItem.category_id,
      amount: recurringItem.amount,
      description: recurringItem.description || '',
      day_of_month: recurringItem.day_of_month,
      start_date: dateValue,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRecurringItem(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const activeItems = recurringItems.filter(item => item.is_active);
  const totalMonthlyAmount = activeItems.reduce((sum, item) => sum + item.amount, 0);

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
            <p className="text-slate-400">Please sign in to view and manage your recurring items</p>
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
              <span className="gradient-text">Recurring Items</span>
            </h1>
            <p className="text-slate-400">Manage recurring expenses that are automatically generated</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30"
          >
            + New Recurring Item
          </Button>
        </div>

        {/* Total Summary */}
        {recurringItems.length > 0 && (
          <Card className="glass border-white/10 mb-6 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                    Total Monthly Amount
                  </p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(totalMonthlyAmount)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {activeItems.length} active / {recurringItems.length} total recurring {recurringItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Recurring Item Modal */}
        <CreateRecurringItemModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
          categories={categories}
        />

        {/* Recurring Items List */}
        {loading && !recurringItems.length ? (
          <RecurringItemLoadingState />
        ) : recurringItems.length === 0 ? (
          <RecurringItemEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div>
            {recurringItems.map((recurringItem) => (
              <RecurringItemRow
                key={recurringItem.id}
                recurringItem={recurringItem}
                categories={categories}
                isEditing={editingId === recurringItem.id}
                editData={editRecurringItem || {
                  category_id: recurringItem.category_id,
                  amount: recurringItem.amount,
                  description: recurringItem.description || '',
                  day_of_month: recurringItem.day_of_month,
                  start_date: recurringItem.start_date.includes('T')
                    ? recurringItem.start_date.split('T')[0]
                    : recurringItem.start_date,
                }}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCancelEdit={cancelEdit}
                onEditDataChange={(data) => setEditRecurringItem(data)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
