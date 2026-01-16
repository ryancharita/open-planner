import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Calendar, TrendingDown, TrendingUp, CreditCard, Wallet, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenseByCategory {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  category_color: string;
  total_amount: number;
  expense_count: number;
}

interface LoanWithBalance {
  id: string;
  description: string | null;
  principal: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  monthly_payment: number;
  remaining_balance: number;
  is_active: boolean;
}

interface Insight {
  type: 'overspending' | 'loan_acceleration' | 'month_over_month';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actionable?: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

interface DashboardData {
  year: number;
  month: number;
  income: number;
  expenses: number;
  loanObligations: number;
  remainingBalance: number;
  expensesByCategory: ExpenseByCategory[];
  loans: LoanWithBalance[];
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
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

  const fetchDashboardData = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(
        `http://localhost:3001/api/dashboard/monthly?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const responseData = await response.json();
      setData(responseData);

      // Fetch insights in parallel
      const insightsResponse = await fetch(
        `http://localhost:3001/api/insights?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchDashboardData();
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

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-6">
        <div className="glass border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-slate-400 mb-6">
            Please sign in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Monthly <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Clear financial snapshot at a glance
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

        {/* Error State */}
        {error && (
          <Alert className="glass border-red-500/50 bg-red-500/10 mb-8">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Error</AlertTitle>
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
            <Button
              onClick={fetchDashboardData}
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
              <p className="text-slate-400 mt-4">Loading dashboard...</p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Cards */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Income Total */}
            <Card className="glass border-white/10 bg-gradient-to-br from-emerald-600/20 to-green-600/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-600/30 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">
                      Income Total
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-300">
                  {formatCurrency(data.income)}
                </p>
              </CardContent>
            </Card>

            {/* Expense Total */}
            <Card className="glass border-white/10 bg-gradient-to-br from-red-600/20 to-rose-600/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-600/30 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-red-300" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">
                      Expense Total
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-black text-red-300">
                  {formatCurrency(data.expenses)}
                </p>
              </CardContent>
            </Card>

            {/* Loan Obligations */}
            <Card className="glass border-white/10 bg-gradient-to-br from-amber-600/20 to-orange-600/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-600/30 rounded-xl">
                    <CreditCard className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">
                      Loan Obligations
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-300">
                  {formatCurrency(data.loanObligations)}
                </p>
              </CardContent>
            </Card>

            {/* Remaining Balance */}
            <Card className={`glass ${
              data.remainingBalance >= 0
                ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-600/20 to-green-600/20'
                : 'border-red-500/50 bg-gradient-to-br from-red-600/20 to-rose-600/20'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${
                    data.remainingBalance >= 0
                      ? 'bg-emerald-600/30'
                      : 'bg-red-600/30'
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      data.remainingBalance >= 0
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }`} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">
                      Remaining Balance
                    </p>
                  </div>
                </div>
                <p className={`text-3xl font-black ${
                  data.remainingBalance >= 0
                    ? 'text-emerald-300'
                    : 'text-red-300'
                }`}>
                  {formatCurrency(data.remainingBalance)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights Section */}
        {!loading && !error && insights.length > 0 && (
          <Card className="glass border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Sparkles className="w-6 h-6 text-violet-400" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  const severityVariants = {
                    error: 'destructive' as const,
                    warning: 'default' as const,
                    info: 'default' as const,
                    success: 'default' as const,
                  };

                  const severityIcons = {
                    error: <AlertTriangle className="w-5 h-5 text-red-400" />,
                    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                    info: <Info className="w-5 h-5 text-blue-400" />,
                    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
                  };

                  return (
                    <Alert
                      key={index}
                      className={`glass ${
                        insight.severity === 'error' ? 'border-red-500/50 bg-red-500/10' :
                        insight.severity === 'warning' ? 'border-amber-500/50 bg-amber-500/10' :
                        insight.severity === 'info' ? 'border-blue-500/50 bg-blue-500/10' :
                        'border-emerald-500/50 bg-emerald-500/10'
                      }`}
                    >
                      {severityIcons[insight.severity]}
                      <AlertTitle className={insight.severity === 'error' ? 'text-red-300' : insight.severity === 'warning' ? 'text-amber-300' : insight.severity === 'info' ? 'text-blue-300' : 'text-emerald-300'}>
                        {insight.title}
                      </AlertTitle>
                      <AlertDescription className="text-slate-300">
                        {insight.message}
                      </AlertDescription>
                      {insight.actionable && insight.actionLabel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-white/10 hover:bg-white/20 border-white/20"
                          onClick={() => insight.actionRoute && navigate({ to: insight.actionRoute })}
                        >
                          {insight.actionLabel}
                        </Button>
                      )}
                    </Alert>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {!loading && !error && data && (
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">Total Income</span>
                <span className="text-emerald-400 font-semibold text-lg">
                  {formatCurrency(data.income)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">Total Expenses</span>
                <span className="text-red-400 font-semibold text-lg">
                  -{formatCurrency(data.expenses)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">Loan Obligations</span>
                <span className="text-amber-400 font-semibold text-lg">
                  -{formatCurrency(data.loanObligations)}
                </span>
              </div>
              <div className="flex items-center justify-between py-4 pt-6 border-t-2 border-white/20">
                <span className="text-white font-bold text-xl">Remaining Balance</span>
                <span className={`font-black text-2xl ${
                  data.remainingBalance >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}>
                  {formatCurrency(data.remainingBalance)}
                </span>
              </div>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Visuals Section */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Expense by Category Chart */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {data.expensesByCategory.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <p>No expenses data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.expensesByCategory.map(cat => ({
                        name: cat.category_name,
                        value: cat.total_amount,
                        icon: cat.category_icon,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.expensesByCategory.map((entry, index) => {
                        // Parse color or use default
                        const color = entry.category_color || '#3B82F6';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              </CardContent>
            </Card>

            {/* Loan Balance List */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Loan Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {data.loans.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <p>No loans found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {data.loans.map((loan) => (
                    <div
                      key={loan.id}
                      className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">
                            {loan.description || 'Unnamed Loan'}
                          </h4>
                          <div className="text-sm text-slate-400 space-y-1">
                            <p>
                              Principal: {formatCurrency(loan.principal)}
                            </p>
                            <p>
                              Interest Rate: {(loan.interest_rate * 100).toFixed(2)}%
                            </p>
                            <p>
                              Term: {loan.term_months} months
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {loan.is_active ? (
                            <>
                              <p className="text-amber-400 font-bold text-lg mb-1">
                                {formatCurrency(loan.remaining_balance)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatCurrency(loan.monthly_payment)}/mo
                              </p>
                            </>
                          ) : (
                            <p className="text-slate-500 text-sm">Paid Off</p>
                          )}
                        </div>
                      </div>
                      {loan.is_active && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Monthly Payment</span>
                            <span className="text-amber-300 font-semibold">
                              {formatCurrency(loan.monthly_payment)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
