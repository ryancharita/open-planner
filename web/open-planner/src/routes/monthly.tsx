import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, DollarSign, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

interface MonthlyExpenseByCategory {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  category_color: string;
  total_amount: number;
  expense_count: number;
}

interface MonthlyExpensesData {
  year: number;
  month: number;
  expensesByCategory: MonthlyExpenseByCategory[];
  totalSpend: number;
}

export const Route = createFileRoute('/monthly')({
  component: MonthlyPage,
});

function MonthlyPage() {
  const { getToken, isSignedIn } = useAuth();
  const [data, setData] = useState<MonthlyExpensesData | null>(null);
  const [totalIncome, setTotalIncome] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current date
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchMonthlyData = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      // Fetch both expenses and income in parallel
      const [expensesResponse, incomeResponse] = await Promise.all([
        fetch(
          `http://localhost:3001/api/expenses/monthly?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
        fetch(
          `http://localhost:3001/api/income/monthly?year=${selectedYear}&month=${selectedMonth}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
      ]);

      if (!expensesResponse.ok) {
        const errorData = await expensesResponse.json();
        throw new Error(errorData.error || 'Failed to fetch monthly expenses');
      }

      if (!incomeResponse.ok) {
        const errorData = await incomeResponse.json();
        throw new Error(errorData.error || 'Failed to fetch monthly income');
      }

      const expensesData = await expensesResponse.json();
      const incomeData = await incomeResponse.json();

      setData(expensesData);
      setTotalIncome(incomeData.totalIncome || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchMonthlyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate leftover money
  const leftoverMoney = totalIncome !== null && data ? totalIncome - data.totalSpend : null;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-6">
        <Card className="glass border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
            <p className="text-slate-400 mb-6">
              Please sign in to view your monthly expenses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Monthly <span className="gradient-text">Visibility</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Track your expenses by category and see your total monthly spend
          </p>
        </div>

        {/* Month Selector */}
        <Card className="glass border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousMonth}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>

              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-violet-400" />
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </h2>
              </div>

              <Button
                onClick={handleNextMonth}
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
                aria-label="Next month"
                disabled={selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1}
              >
                <ChevronRight
                  className={`w-6 h-6 ${selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1 ? 'text-slate-600' : 'text-white'}`}
                />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leftover Money - Single Summary Number */}
        {leftoverMoney !== null && (
          <Card className={`glass mb-8 ${
            leftoverMoney >= 0
              ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-600/20 to-green-600/20'
              : 'border-red-500/50 bg-gradient-to-r from-red-600/20 to-rose-600/20'
          }`}>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-4">
                <div className={`p-4 rounded-xl ${
                  leftoverMoney >= 0
                    ? 'bg-emerald-600/30'
                    : 'bg-red-600/30'
                }`}>
                  <TrendingUp className={`w-10 h-10 ${
                    leftoverMoney >= 0
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`} />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                    Leftover Money
                  </p>
                  <p className={`text-5xl md:text-6xl font-black ${
                    leftoverMoney >= 0
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`}>
                    {formatCurrency(leftoverMoney)}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    {formatCurrency(totalIncome || 0)} income - {formatCurrency(data?.totalSpend || 0)} expenses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Monthly Spend */}
        {data && (
          <Card className="glass border-white/10 mb-8 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-600/30 rounded-xl">
                  <DollarSign className="w-8 h-8 text-violet-300" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">
                    Total Monthly Spend
                  </p>
                  <p className="text-4xl font-black text-white">
                    {formatCurrency(data.totalSpend)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert className="glass border-red-500/50 bg-red-500/10 mb-8">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
            <Button
              onClick={fetchMonthlyData}
              variant="destructive"
              className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-300"
              size="sm"
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="glass border-white/10">
            <CardContent className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
              <p className="text-slate-400 mt-4">Loading expenses...</p>
            </CardContent>
          </Card>
        )}

        {/* Expenses Table */}
        {!loading && !error && data && (
          <Card className="glass border-white/10 overflow-hidden">
            <CardContent className="p-0">
              {data.expensesByCategory.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 text-lg mb-2">No expenses found</p>
                  <p className="text-slate-500 text-sm">
                    Start tracking your expenses to see them grouped by category here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expensesByCategory.map((expense) => (
                      <tr
                        key={expense.category_id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {expense.category_icon && (
                              <span className="text-2xl">{expense.category_icon}</span>
                            )}
                            <div>
                              <p className="text-white font-semibold">
                                {expense.category_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">
                          {expense.expense_count} {expense.expense_count === 1 ? 'expense' : 'expenses'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-white font-bold text-lg">
                            {formatCurrency(expense.total_amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
