import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Components
import {
  LoanRow,
  CreateLoanModal,
  LoanEmptyState,
  LoanLoadingState,
  ErrorMessage,
} from '../components/loans';

// Types
import type { Loan, LoanFormData } from '../types/loan';

export const Route = createFileRoute('/loans')({
  component: LoansPage,
});

function LoansPage() {
  const { getToken, isSignedIn } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoan, setEditLoan] = useState<LoanFormData | null>(null);

  const fetchLoans = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('http://localhost:3001/api/loans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch loans');
      }

      const data = await response.json();
      setLoans(data.loans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchLoans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleCreate = async (loanData: LoanFormData) => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch('http://localhost:3001/api/loans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create loan');
      }

      setShowCreateModal(false);
      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!isSignedIn || !editLoan) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(`http://localhost:3001/api/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editLoan),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update loan');
      }

      setEditingId(null);
      setEditLoan(null);
      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn) return;

    if (!confirm('Are you sure you want to delete this loan?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(`http://localhost:3001/api/loans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete loan');
      }

      await fetchLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (loan: Loan) => {
    setEditingId(loan.id);
    const dateValue = loan.start_date.includes('T')
      ? loan.start_date.split('T')[0]
      : loan.start_date;
    setEditLoan({
      principal: loan.principal,
      interest_rate: loan.interest_rate,
      term_months: loan.term_months,
      start_date: dateValue,
      description: loan.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLoan(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate total monthly obligations
  const calculateTotalMonthlyPayment = () => {
    return loans.reduce((total, loan) => {
      if (loan.term_months === 0) return total;
      if (loan.interest_rate === 0) return total + (loan.principal / loan.term_months);

      const monthlyRate = loan.interest_rate / 12;
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, loan.term_months);
      const denominator = Math.pow(1 + monthlyRate, loan.term_months) - 1;
      const monthlyPayment = loan.principal * (numerator / denominator);

      // Check if loan is still active
      const startDate = new Date(loan.start_date);
      const now = new Date();
      const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth());

      if (monthsSinceStart < loan.term_months) {
        return total + monthlyPayment;
      }

      return total;
    }, 0);
  };

  const totalMonthlyPayment = calculateTotalMonthlyPayment();

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
            <p className="text-slate-400">Please sign in to view and manage your loans</p>
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
              <span className="gradient-text">Loans</span>
            </h1>
            <p className="text-slate-400">Track and manage all your loans</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/30"
          >
            + New Loan
          </Button>
        </div>

        {/* Total Summary */}
        {loans.length > 0 && (
          <Card className="glass border-white/10 mb-6 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                    Total Monthly Payment
                  </p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(totalMonthlyPayment)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {loans.length} {loans.length === 1 ? 'loan' : 'loans'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && <ErrorMessage message={error} />}

        {/* Create Loan Modal */}
        <CreateLoanModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          loading={loading}
        />

        {/* Loans List */}
        {loading && !loans.length ? (
          <LoanLoadingState />
        ) : loans.length === 0 ? (
          <LoanEmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div>
            {loans.map((loan) => (
              <LoanRow
                key={loan.id}
                loan={loan}
                isEditing={editingId === loan.id}
                editData={editLoan || {
                  principal: loan.principal,
                  interest_rate: loan.interest_rate,
                  term_months: loan.term_months,
                  start_date: loan.start_date.includes('T')
                    ? loan.start_date.split('T')[0]
                    : loan.start_date,
                  description: loan.description || '',
                }}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onCancelEdit={cancelEdit}
                onEditDataChange={(data) => setEditLoan(data)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
