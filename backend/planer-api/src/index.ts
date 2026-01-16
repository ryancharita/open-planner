import { Hono } from "hono";
import { cors } from "hono/cors";
import { clerkAuthMiddleware, supabaseMiddleware } from "./middleware/auth.middleware";
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

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

// Mount route handlers
app.route('/api', usersRouter);
app.route('/api/categories', categoriesRouter);
app.route('/api/expenses', expensesRouter);
app.route('/api/income', incomeRouter);
app.route('/api/loans', loansRouter);
app.route('/api/recurring-items', recurringItemsRouter);
app.route('/api/dashboard', dashboardRouter);

export default app
