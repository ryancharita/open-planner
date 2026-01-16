import { Hono } from "hono";
import { getSupabaseService, getUserId } from "../middleware/auth.middleware";
import { createCategory, CreateCategoryInput, getCategories, updateCategory, UpdateCategoryInput, deleteCategory } from "../utils/categories";

const categoriesRouter = new Hono();

categoriesRouter.get('/', async (c) => {
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

categoriesRouter.post('/', async (c) => {
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

categoriesRouter.put('/:id', async (c) => {
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

categoriesRouter.delete('/:id', async (c) => {
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

export default categoriesRouter;
