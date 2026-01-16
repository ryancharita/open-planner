import { Hono } from "hono";
import { cors } from "hono/cors";
import { clerkAuthMiddleware, getSupabaseService, getUserId, supabaseMiddleware } from "./middleware/auth.middleware";
import { getOrCreateUser } from "./utils/users";
import { createCategory, CreateCategoryInput, getCategories, updateCategory, UpdateCategoryInput, deleteCategory } from "./utils/categories";
import { getExpenses, getMonthlyExpensesByCategory, getTotalMonthlySpend, CreateExpenseInput, createExpense, UpdateExpenseInput, updateExpense, deleteExpense } from "./utils/expenses";
import { getIncome, getTotalMonthlyIncome, CreateIncomeInput, createIncome, UpdateIncomeInput, updateIncome, deleteIncome } from "./utils/income";
import { getLoans, CreateLoanInput, createLoan, UpdateLoanInput, updateLoan, deleteLoan, calculateTotalLoanObligations, calculateMonthlyPayment } from "./utils/loans";
import { getRecurringItems, CreateRecurringItemInput, createRecurringItem, UpdateRecurringItemInput, updateRecurringItem, deleteRecurringItem, generateRecurringExpenses } from "./utils/recurring-items";
import { validateUUID, validateAmount, validateBackdatedEntry, validateDescription, validateInterestRate, validateTermMonths, validateFutureDate, validateDayOfMonth } from "./utils/validation";
// Use dynamic import for insights to avoid module initialization order issues
// import { getInsights } from "./utils/insights";

const app = new Hono();

// Enable CORS for frontend
app.use('*', cors({
  origin: ['http://localhost:3000', "https://open-planner.vercel.app"],
  credentials: true,
}));

// Apply Clerk auth middleware to all routes
app.use('*', clerkAuthMiddleware());

// Apply Supabase middleware for database operations
app.use('*', supabaseMiddleware());

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.get('/api/me', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    // Auto-create user if they don't exist
    const user = await getOrCreateUser(supabaseService, clerkUserId);

    return c.json({
      userId: user.id,
      clerkUserId: user.clerk_user_id,
      currency: user.currency,
      created_at: user.created_at,
      message: 'Authenticated user',
    });
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return c.json(
      { error: 'Failed to get user', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

// Categories CRUD endpoints
app.get('/api/categories', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const categories = await getCategories(supabaseService, clerkUserId);
    return c.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    return c.json(
      { error: 'Failed to get categories', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

app.post('/api/categories', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const body = await c.req.json() as CreateCategoryInput;

    if (!body.name || body.name.trim() === '') {
      return c.json({ error: 'Category name is required' }, 400);
    }

    const category = await createCategory(supabaseService, clerkUserId, {
      name: body.name.trim(),
      icon: body.icon,
      color: body.color,
    });

    return c.json({ category }, 201);
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle unique constraint violation
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return c.json({ error: 'Category with this name already exists' }, 409);
    }

    return c.json(
      { error: 'Failed to create category', details: errorMessage },
      500
    );
  }
});

app.put('/api/categories/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const categoryId = c.req.param('id');
    const body = await c.req.json() as UpdateCategoryInput;

    if (body.name !== undefined && body.name.trim() === '') {
      return c.json({ error: 'Category name cannot be empty' }, 400);
    }

    const category = await updateCategory(supabaseService, clerkUserId, categoryId, {
      name: body.name?.trim(),
      icon: body.icon,
      color: body.color,
    });

    return c.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Category not found or access denied' }, 404);
    }

    if (errorMessage.includes('default category')) {
      return c.json({ error: 'Cannot update default category' }, 403);
    }

    return c.json(
      { error: 'Failed to update category', details: errorMessage },
      500
    );
  }
});

app.delete('/api/categories/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const categoryId = c.req.param('id');
    await deleteCategory(supabaseService, clerkUserId, categoryId);

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Category not found or access denied' }, 404);
    }

    if (errorMessage.includes('default category')) {
      return c.json({ error: 'Cannot delete default category' }, 403);
    }

    return c.json(
      { error: 'Failed to delete category', details: errorMessage },
      500
    );
  }
});

// Expenses CRUD endpoints
app.get('/api/expenses', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const expenses = await getExpenses(supabaseService, clerkUserId, startDate, endDate);
    return c.json({ expenses });
  } catch (error) {
    console.error('Error getting expenses:', error);
    return c.json(
      { error: 'Failed to get expenses', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

// Get monthly expenses grouped by category
app.get('/api/expenses/monthly', async (c) => {
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

    const [expensesByCategory, totalSpend] = await Promise.all([
      getMonthlyExpensesByCategory(supabaseService, clerkUserId, year, month),
      getTotalMonthlySpend(supabaseService, clerkUserId, year, month),
    ]);

    return c.json({
      year,
      month,
      expensesByCategory,
      totalSpend,
    });
  } catch (error) {
    console.error('Error getting monthly expenses:', error);
    return c.json(
      { error: 'Failed to get monthly expenses', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

app.post('/api/expenses', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const body = await c.req.json() as CreateExpenseInput;

    // Validate category_id
    if (!body.category_id) {
      return c.json({ error: 'Category ID is required' }, 400);
    }
    const categoryIdValidation = validateUUID(body.category_id);
    if (!categoryIdValidation.valid) {
      return c.json({ error: categoryIdValidation.error }, 400);
    }

    // Validate amount
    const amountValidation = validateAmount(body.amount);
    if (!amountValidation.valid) {
      return c.json({ error: amountValidation.error }, 400);
    }

    // Validate date if provided (allow backdated entries)
    if (body.date) {
      const dateValidation = validateBackdatedEntry(body.date);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    const descValidation = validateDescription(body.description);
    if (!descValidation.valid) {
      return c.json({ error: descValidation.error }, 400);
    }

    const expense = await createExpense(supabaseService, clerkUserId, {
      category_id: body.category_id,
      amount: body.amount,
      description: body.description,
      date: body.date,
    });

    return c.json({ expense }, 201);
  } catch (error) {
    console.error('Error creating expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Category not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to create expense', details: errorMessage },
      500
    );
  }
});

app.put('/api/expenses/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const expenseId = c.req.param('id');

    // Validate expense ID
    const expenseIdValidation = validateUUID(expenseId);
    if (!expenseIdValidation.valid) {
      return c.json({ error: expenseIdValidation.error }, 400);
    }

    const body = await c.req.json() as UpdateExpenseInput;

    // Validate amount if provided
    if (body.amount !== undefined) {
      const amountValidation = validateAmount(body.amount);
      if (!amountValidation.valid) {
        return c.json({ error: amountValidation.error }, 400);
      }
    }

    // Validate category_id if provided
    if (body.category_id !== undefined) {
      const categoryIdValidation = validateUUID(body.category_id);
      if (!categoryIdValidation.valid) {
        return c.json({ error: categoryIdValidation.error }, 400);
      }
    }

    // Validate date if provided
    if (body.date !== undefined) {
      const dateValidation = validateBackdatedEntry(body.date);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const expense = await updateExpense(supabaseService, clerkUserId, expenseId, {
      category_id: body.category_id,
      amount: body.amount,
      description: body.description,
      date: body.date,
    });

    return c.json({ expense });
  } catch (error) {
    console.error('Error updating expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Expense not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to update expense', details: errorMessage },
      500
    );
  }
});

app.delete('/api/expenses/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const expenseId = c.req.param('id');

    // Validate expense ID
    const expenseIdValidation = validateUUID(expenseId);
    if (!expenseIdValidation.valid) {
      return c.json({ error: expenseIdValidation.error }, 400);
    }

    await deleteExpense(supabaseService, clerkUserId, expenseId);

    return c.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Expense not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to delete expense', details: errorMessage },
      500
    );
  }
});

// Income CRUD endpoints
app.get('/api/income', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const income = await getIncome(supabaseService, clerkUserId, startDate, endDate);
    return c.json({ income });
  } catch (error) {
    console.error('Error getting income:', error);
    return c.json(
      { error: 'Failed to get income', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

// Get total monthly income
app.get('/api/income/monthly', async (c) => {
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

    const totalIncome = await getTotalMonthlyIncome(supabaseService, clerkUserId, year, month);

    return c.json({
      year,
      month,
      totalIncome,
    });
  } catch (error) {
    console.error('Error getting monthly income:', error);
    return c.json(
      { error: 'Failed to get monthly income', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

app.post('/api/income', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const body = await c.req.json() as CreateIncomeInput;

    // Validate amount
    const amountValidation = validateAmount(body.amount);
    if (!amountValidation.valid) {
      return c.json({ error: amountValidation.error }, 400);
    }

    // Validate date if provided (allow backdated entries)
    if (body.date) {
      const dateValidation = validateBackdatedEntry(body.date);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const income = await createIncome(supabaseService, clerkUserId, {
      amount: body.amount,
      description: body.description,
      date: body.date,
      is_recurring: body.is_recurring,
    });

    return c.json({ income }, 201);
  } catch (error) {
    console.error('Error creating income:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return c.json(
      { error: 'Failed to create income', details: errorMessage },
      500
    );
  }
});

app.put('/api/income/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const incomeId = c.req.param('id');

    // Validate income ID
    const incomeIdValidation = validateUUID(incomeId);
    if (!incomeIdValidation.valid) {
      return c.json({ error: incomeIdValidation.error }, 400);
    }

    const body = await c.req.json() as UpdateIncomeInput;

    // Validate amount if provided
    if (body.amount !== undefined) {
      const amountValidation = validateAmount(body.amount);
      if (!amountValidation.valid) {
        return c.json({ error: amountValidation.error }, 400);
      }
    }

    // Validate date if provided
    if (body.date !== undefined) {
      const dateValidation = validateBackdatedEntry(body.date);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const income = await updateIncome(supabaseService, clerkUserId, incomeId, {
      amount: body.amount,
      description: body.description,
      date: body.date,
      is_recurring: body.is_recurring,
    });

    return c.json({ income });
  } catch (error) {
    console.error('Error updating income:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Income not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to update income', details: errorMessage },
      500
    );
  }
});

app.delete('/api/income/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const incomeId = c.req.param('id');
    await deleteIncome(supabaseService, clerkUserId, incomeId);

    return c.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Income not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to delete income', details: errorMessage },
      500
    );
  }
});

// Loans CRUD endpoints
app.get('/api/loans', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const loans = await getLoans(supabaseService, clerkUserId);
    return c.json({ loans });
  } catch (error) {
    console.error('Error getting loans:', error);
    return c.json(
      { error: 'Failed to get loans', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

app.post('/api/loans', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const body = await c.req.json() as CreateLoanInput;

    // Validate principal
    const principalValidation = validateAmount(body.principal);
    if (!principalValidation.valid) {
      return c.json({ error: principalValidation.error }, 400);
    }

    // Validate interest rate
    const interestValidation = validateInterestRate(body.interest_rate);
    if (!interestValidation.valid) {
      return c.json({ error: interestValidation.error }, 400);
    }

    // Validate term months
    const termValidation = validateTermMonths(body.term_months);
    if (!termValidation.valid) {
      return c.json({ error: termValidation.error }, 400);
    }

    // Validate start_date if provided
    if (body.start_date) {
      const dateValidation = validateFutureDate(body.start_date, true);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const loan = await createLoan(supabaseService, clerkUserId, {
      principal: body.principal,
      interest_rate: body.interest_rate,
      term_months: body.term_months,
      start_date: body.start_date,
      description: body.description,
    });

    return c.json({ loan }, 201);
  } catch (error) {
    console.error('Error creating loan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return c.json(
      { error: 'Failed to create loan', details: errorMessage },
      500
    );
  }
});

app.put('/api/loans/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const loanId = c.req.param('id');

    // Validate loan ID
    const loanIdValidation = validateUUID(loanId);
    if (!loanIdValidation.valid) {
      return c.json({ error: loanIdValidation.error }, 400);
    }

    const body = await c.req.json() as UpdateLoanInput;

    // Validate principal if provided
    if (body.principal !== undefined) {
      const principalValidation = validateAmount(body.principal);
      if (!principalValidation.valid) {
        return c.json({ error: principalValidation.error }, 400);
      }
    }

    // Validate interest rate if provided
    if (body.interest_rate !== undefined) {
      const interestValidation = validateInterestRate(body.interest_rate);
      if (!interestValidation.valid) {
        return c.json({ error: interestValidation.error }, 400);
      }
    }

    // Validate term months if provided
    if (body.term_months !== undefined) {
      const termValidation = validateTermMonths(body.term_months);
      if (!termValidation.valid) {
        return c.json({ error: termValidation.error }, 400);
      }
    }

    // Validate start_date if provided
    if (body.start_date !== undefined) {
      const dateValidation = validateFutureDate(body.start_date, true);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const loan = await updateLoan(supabaseService, clerkUserId, loanId, {
      principal: body.principal,
      interest_rate: body.interest_rate,
      term_months: body.term_months,
      start_date: body.start_date,
      description: body.description,
    });

    return c.json({ loan });
  } catch (error) {
    console.error('Error updating loan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Loan not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to update loan', details: errorMessage },
      500
    );
  }
});

app.delete('/api/loans/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const loanId = c.req.param('id');
    await deleteLoan(supabaseService, clerkUserId, loanId);

    return c.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Loan not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to delete loan', details: errorMessage },
      500
    );
  }
});

// Recurring Items CRUD endpoints
app.get('/api/recurring-items', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const activeOnly = c.req.query('activeOnly') === 'true';
    const recurringItems = await getRecurringItems(supabaseService, clerkUserId, activeOnly);
    return c.json({ recurringItems });
  } catch (error) {
    console.error('Error getting recurring items:', error);
    return c.json(
      { error: 'Failed to get recurring items', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

app.post('/api/recurring-items', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const body = await c.req.json() as CreateRecurringItemInput;

    // Validate category_id
    if (!body.category_id) {
      return c.json({ error: 'Category ID is required' }, 400);
    }
    const categoryIdValidation = validateUUID(body.category_id);
    if (!categoryIdValidation.valid) {
      return c.json({ error: categoryIdValidation.error }, 400);
    }

    // Validate amount
    const amountValidation = validateAmount(body.amount);
    if (!amountValidation.valid) {
      return c.json({ error: amountValidation.error }, 400);
    }

    // Validate day_of_month
    if (body.day_of_month !== undefined) {
      const dayValidation = validateDayOfMonth(body.day_of_month);
      if (!dayValidation.valid) {
        return c.json({ error: dayValidation.error }, 400);
      }
    }

    // Validate start_date if provided
    if (body.start_date) {
      const dateValidation = validateFutureDate(body.start_date, true);
      if (!dateValidation.valid) {
        return c.json({ error: dateValidation.error }, 400);
      }
    }

    // Validate description
    if (body.description !== undefined) {
      const descValidation = validateDescription(body.description);
      if (!descValidation.valid) {
        return c.json({ error: descValidation.error }, 400);
      }
    }

    const recurringItem = await createRecurringItem(supabaseService, clerkUserId, {
      category_id: body.category_id,
      amount: body.amount,
      description: body.description,
      day_of_month: body.day_of_month,
      start_date: body.start_date,
    });

    return c.json({ recurringItem }, 201);
  } catch (error) {
    console.error('Error creating recurring item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Category not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to create recurring item', details: errorMessage },
      500
    );
  }
});

app.put('/api/recurring-items/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const recurringItemId = c.req.param('id');
    const body = await c.req.json() as UpdateRecurringItemInput;

    if (body.amount !== undefined && body.amount <= 0) {
      return c.json({ error: 'Amount must be greater than 0' }, 400);
    }

    if (body.day_of_month !== undefined && (body.day_of_month < 1 || body.day_of_month > 31)) {
      return c.json({ error: 'Day of month must be between 1 and 31' }, 400);
    }

    const recurringItem = await updateRecurringItem(supabaseService, clerkUserId, recurringItemId, {
      category_id: body.category_id,
      amount: body.amount,
      description: body.description,
      day_of_month: body.day_of_month,
      start_date: body.start_date,
      is_active: body.is_active,
    });

    return c.json({ recurringItem });
  } catch (error) {
    console.error('Error updating recurring item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Recurring item not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to update recurring item', details: errorMessage },
      500
    );
  }
});

app.delete('/api/recurring-items/:id', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    const recurringItemId = c.req.param('id');
    await deleteRecurringItem(supabaseService, clerkUserId, recurringItemId);

    return c.json({ message: 'Recurring item deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
      return c.json({ error: 'Recurring item not found or access denied' }, 404);
    }

    return c.json(
      { error: 'Failed to delete recurring item', details: errorMessage },
      500
    );
  }
});

// Generate recurring expenses endpoint (can be called on login or via cron)
app.post('/api/recurring-items/generate', async (c) => {
  const clerkUserId = getUserId(c);

  if (!clerkUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseService = getSupabaseService(c);
  if (!supabaseService) {
    return c.json({ error: 'Service unavailable' }, 500);
  }

  try {
    // Optional: allow specifying year/month, otherwise uses current month
    const year = c.req.query('year') ? parseInt(c.req.query('year')!) : undefined;
    const month = c.req.query('month') ? parseInt(c.req.query('month')!) : undefined;

    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      return c.json({ error: 'Invalid year' }, 400);
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return c.json({ error: 'Invalid month' }, 400);
    }

    const result = await generateRecurringExpenses(supabaseService, clerkUserId, year, month);

    return c.json({
      message: 'Recurring expenses generation completed',
      generated: result.generated_count,
      skipped: result.skipped_count,
    });
  } catch (error) {
    console.error('Error generating recurring expenses:', error);
    return c.json(
      { error: 'Failed to generate recurring expenses', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

// Monthly Dashboard endpoint
app.get('/api/dashboard/monthly', async (c) => {
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

// Insights endpoint
// app.get('/api/insights', async (c) => {
//   const clerkUserId = getUserId(c);

//   if (!clerkUserId) {
//     return c.json({ error: 'Unauthorized' }, 401);
//   }

//   const supabaseService = getSupabaseService(c);
//   if (!supabaseService) {
//     return c.json({ error: 'Service unavailable' }, 500);
//   }

//   try {
//     const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
//     const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());

//     if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
//       return c.json({ error: 'Invalid year or month' }, 400);
//     }

//     // // Use dynamic import to avoid module initialization order issues
//     // const { getInsights } = await import("./utils/insights");
//     const insights = await getInsights(supabaseService, clerkUserId, year, month);

//     return c.json({
//       year,
//       month,
//       insights,
//     });
//   } catch (error) {
//     console.error('Error getting insights:', error);
//     return c.json(
//       { error: 'Failed to get insights', details: error instanceof Error ? error.message : 'Unknown error' },
//       500
//     );
//   }
// });

export default app
