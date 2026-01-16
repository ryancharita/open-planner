import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getTotalMonthlyIncome } from "../utils/income";
import { getTotalMonthlySpend, getMonthlyExpensesByCategory } from "../utils/expenses";
import { getLoans, calculateTotalLoanObligations, calculateMonthlyPayment } from "../utils/loans";

const dashboardRouter = new Hono();

// Monthly Dashboard endpoint
dashboardRouter.get('/monthly', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({ error: 'Invalid year or month' }, 400);
    }

    // Fetch all required data in parallel
    const [totalIncome, totalExpenses, expensesByCategory, loans] = await Promise.all([
      getTotalMonthlyIncome(supabaseService, clerkUserId, year, month),
      getTotalMonthlySpend(supabaseService, clerkUserId, year, month),
      getMonthlyExpensesByCategory(supabaseService, clerkUserId, year, month),
      getLoans(supabaseService, clerkUserId),
    ]);

    // Calculate loan obligations and prepare loan details with balances
    const loanObligations = calculateTotalLoanObligations(loans);

    // Calculate remaining balance for each loan and prepare loan list
    const now = new Date();
    const loansWithBalances = loans.map(loan => {
      const startDate = new Date(loan.start_date);
      const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth());
      const isActive = monthsSinceStart < loan.term_months;
      const monthlyPayment = isActive
        ? calculateMonthlyPayment(loan.principal, loan.interest_rate, loan.term_months)
        : 0;

      // Calculate remaining balance (simplified: principal - (months paid * monthly payment))
      // For a more accurate calculation, we'd need to track actual payments, but for now
      // we'll show the original principal as a placeholder
      const remainingBalance = isActive
        ? Math.max(0, loan.principal - (monthsSinceStart * monthlyPayment))
        : 0;

      return {
        id: loan.id,
        description: loan.description,
        principal: loan.principal,
        interest_rate: loan.interest_rate,
        term_months: loan.term_months,
        start_date: loan.start_date,
        monthly_payment: monthlyPayment,
        remaining_balance: remainingBalance,
        is_active: isActive,
      };
    });

    // Calculate remaining balance
    const remainingBalance = totalIncome - totalExpenses - loanObligations;

    return c.json({
      year,
      month,
      income: totalIncome,
      expenses: totalExpenses,
      loanObligations,
      remainingBalance,
      expensesByCategory,
      loans: loansWithBalances,
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return c.json(
      { error: 'Failed to get dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default dashboardRouter;
