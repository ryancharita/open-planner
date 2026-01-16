# Hono + Bun API

A high-performance API built with [Hono](https://hono.dev/) and [Bun](https://bun.sh/), featuring Clerk authentication and Supabase database.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create a `.env` file in the `backend/api` directory with the following variables:
   - `CLERK_SECRET_KEY`: Your Clerk secret key (from Clerk Dashboard)
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for user creation)
   - `PORT`: Server port (default: 3001)

3. Run the database migration:
   - See `supabase/README.md` for instructions on running migrations
   - The migration creates the `users` table with RLS policies

3. In the frontend (`web/open-planner`), create a `.env` file with:
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key (from Clerk Dashboard)

## Development

Run the development server with hot reload:
```bash
bun run dev
```

The server will start at `http://localhost:3001` (or the port specified in your `.env`).

## Production

Run the production server:
```bash
bun run start
```

## API Endpoints

### Authentication
- `GET /health` - Health check endpoint
- `GET /api/me` - Get current authenticated user (auto-creates if doesn't exist, requires Clerk JWT token in Authorization header)
  - Returns: `{ userId, clerkUserId, currency, created_at, message }`

### Categories
- `GET /api/categories` - Get all categories for the authenticated user
  - Returns: `{ categories: Category[] }`
- `POST /api/categories` - Create a new category
  - Body: `{ name: string, icon?: string, color?: string }`
  - Returns: `{ category: Category }`
- `PUT /api/categories/:id` - Update a category
  - Body: `{ name?: string, icon?: string, color?: string }`
  - Returns: `{ category: Category }`
  - Note: Cannot update default categories
- `DELETE /api/categories/:id` - Delete a category
  - Returns: `{ message: string }`
  - Note: Cannot delete default categories

All category endpoints require Clerk JWT token in `Authorization: Bearer <token>` header.

## Authentication Flow

1. User signs in/signs up via Clerk on the frontend
2. Frontend gets JWT token from Clerk using `getToken()`
3. Frontend sends token in `Authorization: Bearer <token>` header to API
4. Backend verifies token using Clerk's `verifyToken()` function
5. Backend extracts user ID from token and makes it available via `getUserId(c)`
6. On first API call, backend auto-creates user row in Supabase `users` table
7. User data is returned with database ID, currency, and timestamps

## Database Schema

### users table
- `id` (UUID) - Primary key
- `clerk_user_id` (TEXT) - Unique Clerk user identifier
- `currency` (TEXT) - User's preferred currency (default: 'USD')
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### categories table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `name` (TEXT) - Category name (unique per user)
- `icon` (TEXT) - Optional emoji/icon for the category
- `color` (TEXT) - Hex color code (default: '#3B82F6')
- `is_default` (BOOLEAN) - Whether this is a default seeded category
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### Default Categories
When a user is first created, the following default categories are automatically seeded:
- Food & Dining 🍽️
- Transportation 🚗
- Shopping 🛍️
- Bills & Utilities 💡
- Entertainment 🎬
- Healthcare 🏥
- Education 📚
- Travel ✈️
- Personal Care 💅
- Other 📦

### Row Level Security (RLS)
- RLS is enabled on both `users` and `categories` tables
- Users can only read/write their own data through secure database functions
- All operations validate `clerk_user_id` ownership
- Default categories cannot be updated or deleted

## Features

- ⚡ **Fast**: Powered by Bun runtime for maximum performance
- 🔥 **Hot Reload**: Automatic server restart on file changes during development
- 🔐 **Authentication**: Clerk JWT-based authentication
- 🗄️ **Database**: Supabase for data storage (separate from auth)
- 🛡️ **Type Safe**: Full TypeScript support
- 🚀 **Lightweight**: No build step required, runs directly with Bun
