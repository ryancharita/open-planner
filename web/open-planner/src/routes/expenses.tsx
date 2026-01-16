import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Components
import {
  ExpenseRow,
  CreateExpenseModal,
  ExpenseEmptyState,
  ExpenseLoadingState,
  ErrorMessage,
} from '../components/expenses';

// Types
import type { Expense, ExpenseFormData } from '../types/expense';
import type { Category } from '../types/category';

export const Route = createFileRoute('/expenses')({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { getToken, isSignedIn } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpense, setEditExpense] = useState<ExpenseFormData | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchCategories = async () => {
    if (!isSignedIn) return;

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
      console.error('Error fetching categories:', err);
    }
  };

  const fetchExpenses = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      let url = 'import.meta.env.VITE_API_UPL/api/expenses';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCategories();
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, startDate, endDate]);

  const handleCreate = async (expenseData: ExpenseFormData) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('import.meta.env.VITE_API_UPL/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create expense');
      }

      setShowCreateModal(false);
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isSignedIn || !editExpense) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editExpense),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update expense');
      }

      setEditingId(null);
      setEditExpense(null);
      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn) return;

    if (!confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete expense');
      }

      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    // Handle date - it might be in ISO format or just date string
    const dateValue = expense.date.includes('T')
      ? expense.date.split('T')[0]
      : expense.date;
    setEditExpense({
      category_id: expense.category_id,
      amount: expense.amount,
      description: expense.description || '',
      date: dateValue,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditExpense(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
            <p className="text-slate-400">Please sign in to view and manage your expenses</p>
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
              <span className="gradient-text">Expenses</span>
            </h1>
            <p className="text-slate-400">Track and manage all your expenses</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30"
          >
            + New Expense
          </Button>
        </div>

        {/* Date Filters */}
        <Card className="glass border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-300">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass border-white/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-300">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="glass border-white/20 text-white"
                />
              </div>
              <div>
                <Button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  variant="outline"
                  className="w-full glass border-white/20 hover:border-white/40"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Summary */}
        {expenses.length > 0 && (
          <Card className="glass border-white/10 mb-6 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                    Total Expenses
                  </p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Expense Modal */}
        <CreateExpenseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
          categories={categories}
        />

        {/* Expenses List */}
        {loading && !expenses.length ? (
          <ExpenseLoadingState />
        ) : expenses.length === 0 ? (
          <ExpenseEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div>
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                categories={categories}
                isEditing={editingId === expense.id}
                editData={editExpense || {
                  category_id: expense.category_id,
                  amount: expense.amount,
                  description: expense.description || '',
                  date: expense.date.includes('T')
                    ? expense.date.split('T')[0]
                    : expense.date,
                }}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCancelEdit={cancelEdit}
                onEditDataChange={(data) => setEditExpense(data)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
