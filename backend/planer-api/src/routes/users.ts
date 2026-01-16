import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { getOrCreateUser } from "../utils/users";

const usersRouter = new Hono();

usersRouter.get('/me', async (c) => {
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

export default usersRouter;
