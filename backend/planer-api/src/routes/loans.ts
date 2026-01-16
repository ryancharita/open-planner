import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getLoans, CreateLoanInput, createLoan, UpdateLoanInput, updateLoan, deleteLoan } from "../utils/loans";
import { validateUUID, validateAmount, validateInterestRate, validateTermMonths, validateFutureDate, validateDescription } from "../utils/validation";

const loansRouter = new Hono();

loansRouter.get('/', async (c) => {
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

loansRouter.post('/', async (c) => {
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

loansRouter.put('/:id', async (c) => {
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

loansRouter.delete('/:id', async (c) => {
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

export default loansRouter;
