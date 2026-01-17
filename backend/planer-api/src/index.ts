import { Hono } from "hono";
import { cors } from "hono/cors";
import { clerkAuthMiddleware, supabaseMiddleware, getSupabaseService, getUserId } from "./middleware/auth.middleware";
import { getOrCreateUser } from "./utils/users";
import usersRouter from "./routes/users";
import categoriesRouter from "./routes/categories";
import expensesRouter from "./routes/expenses";
import incomeRouter from "./routes/income";
import loansRouter from "./routes/loans";
import recurringItemsRouter from "./routes/recurring-items";
import dashboardRouter from "./routes/dashboard";

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

// Mount route handlers BEFORE root route for Vercel to detect them
app.route('/api', usersRouter);

// Test route to verify Vercel detects /api routes
app.get('/api/test', (c) => c.json({ message: 'API routing works!' }));
app.route('/api/categories', categoriesRouter);
app.route('/api/expenses', expensesRouter);
app.route('/api/income', incomeRouter);
app.route('/api/loans', loansRouter);
app.route('/api/recurring-items', recurringItemsRouter);
app.route('/api/dashboard', dashboardRouter);

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

export default app
