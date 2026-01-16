import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getIncome, getTotalMonthlyIncome, CreateIncomeInput, createIncome, UpdateIncomeInput, updateIncome, deleteIncome } from "../utils/income";
import { validateUUID, validateAmount, validateBackdatedEntry, validateDescription } from "../utils/validation";

const incomeRouter = new Hono();

incomeRouter.get('/', async (c) => {
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
incomeRouter.get('/monthly', async (c) => {
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

incomeRouter.post('/', async (c) => {
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

incomeRouter.put('/:id', async (c) => {
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

incomeRouter.delete('/:id', async (c) => {
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

export default incomeRouter;
