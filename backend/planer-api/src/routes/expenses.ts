import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getExpenses, getMonthlyExpensesByCategory, getTotalMonthlySpend, CreateExpenseInput, createExpense, UpdateExpenseInput, updateExpense, deleteExpense } from "../utils/expenses";
import { validateUUID, validateAmount, validateBackdatedEntry, validateDescription } from "../utils/validation";

const expensesRouter = new Hono();

expensesRouter.get('/', async (c) => {
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
expensesRouter.get('/monthly', async (c) => {
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

expensesRouter.post('/', async (c) => {
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

expensesRouter.put('/:id', async (c) => {
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

expensesRouter.delete('/:id', async (c) => {
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

export default expensesRouter;
