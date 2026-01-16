import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getRecurringItems, CreateRecurringItemInput, createRecurringItem, UpdateRecurringItemInput, updateRecurringItem, deleteRecurringItem, generateRecurringExpenses } from "../utils/recurring-items";
import { validateUUID, validateAmount, validateFutureDate, validateDayOfMonth, validateDescription } from "../utils/validation";

const recurringItemsRouter = new Hono();

recurringItemsRouter.get('/', async (c) => {
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

recurringItemsRouter.post('/', async (c) => {
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

recurringItemsRouter.put('/:id', async (c) => {
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

recurringItemsRouter.delete('/:id', async (c) => {
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
recurringItemsRouter.post('/generate', async (c) => {
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

export default recurringItemsRouter;
