import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Components
import {
  IncomeRow,
  CreateIncomeModal,
  IncomeEmptyState,
  IncomeLoadingState,
  ErrorMessage,
} from '../components/income';

// Types
import type { Income, IncomeFormData } from '../types/income';

export const Route = createFileRoute('/income')({
  component: IncomePage,
});

function IncomePage() {
  const { getToken, isSignedIn } = useAuth();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIncome, setEditIncome] = useState<IncomeFormData | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchIncome = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      let url = 'import.meta.env.VITE_API_UPL/api/income';
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
        throw new Error(errorData.error || 'Failed to fetch income');
      }

      const data = await response.json();
      setIncome(data.income || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchIncome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, startDate, endDate]);

  const handleCreate = async (incomeData: IncomeFormData) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('import.meta.env.VITE_API_UPL/api/income', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create income');
      }

      setShowCreateModal(false);
      await fetchIncome();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isSignedIn || !editIncome) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/income/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editIncome),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update income');
      }

      setEditingId(null);
      setEditIncome(null);
      await fetchIncome();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn) return;

    if (!confirm('Are you sure you want to delete this income entry?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(import.meta.env.VITE_API_UPL + `/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete income');
      }

      await fetchIncome();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (incomeEntry: Income) => {
    setEditingId(incomeEntry.id);
    // Handle date - it might be in ISO format or just date string
    const dateValue = incomeEntry.date.includes('T')
      ? incomeEntry.date.split('T')[0]
      : incomeEntry.date;
    setEditIncome({
      amount: incomeEntry.amount,
      description: incomeEntry.description || '',
      date: dateValue,
      is_recurring: incomeEntry.is_recurring,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditIncome(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAmount = income.reduce((sum, entry) => sum + entry.amount, 0);
  const recurringCount = income.filter(entry => entry.is_recurring).length;

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
            <p className="text-slate-400">Please sign in to view and manage your income</p>
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
              <span className="gradient-text">Income</span>
            </h1>
            <p className="text-slate-400">Track and manage all your income entries</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30"
          >
            + New Income
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
        {income.length > 0 && (
          <Card className="glass border-white/10 mb-6 bg-gradient-to-r from-emerald-600/20 to-green-600/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                    Total Income
                  </p>
                  <p className="text-3xl font-black text-emerald-300">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {income.length} {income.length === 1 ? 'entry' : 'entries'}
                    {recurringCount > 0 && (
                      <span className="ml-2">
                        • {recurringCount} {recurringCount === 1 ? 'recurring' : 'recurring'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Income Modal */}
        <CreateIncomeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
        />

        {/* Income List */}
        {loading && !income.length ? (
          <IncomeLoadingState />
        ) : income.length === 0 ? (
          <IncomeEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div>
            {income.map((incomeEntry) => (
              <IncomeRow
                key={incomeEntry.id}
                income={incomeEntry}
                isEditing={editingId === incomeEntry.id}
                editData={editIncome || {
                  amount: incomeEntry.amount,
                  description: incomeEntry.description || '',
                  date: incomeEntry.date.includes('T')
                    ? incomeEntry.date.split('T')[0]
                    : incomeEntry.date,
                  is_recurring: incomeEntry.is_recurring,
                }}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCancelEdit={cancelEdit}
                onEditDataChange={(data) => setEditIncome(data)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
