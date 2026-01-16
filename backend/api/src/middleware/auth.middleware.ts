import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { setCookie } from 'hono/cookie'
import { verifyToken } from '@clerk/backend'

declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseClient
    supabaseService: SupabaseClient
    userId: string | null
  }
}

export const getSupabase = (c: Context) => {
  return c.get('supabase')
}

export const getUserId = (c: Context) => {
  return c.get('userId')
}

type ClerkEnv = {
  CLERK_SECRET_KEY: string
}

type SupabaseEnv = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export const clerkAuthMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const clerkEnv = env<ClerkEnv>(c)
    const clerkSecretKey = clerkEnv.CLERK_SECRET_KEY

    if (!clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY missing!')
    }

    // Get the Authorization header
    const authHeader = c.req.header('Authorization')
    let userId: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = await verifyToken(token, {
          secretKey: clerkSecretKey,
        })
        userId = payload.sub || null
      } catch (error) {
        // Token is invalid, but we'll continue without setting userId
        console.log('Invalid token:', error)
      }
    }

    c.set('userId', userId)
    await next()
  }
}

export const getSupabaseService = (c: Context) => {
  return c.get('supabaseService')
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c)
    const supabaseUrl = supabaseEnv.SUPABASE_URL
    const supabaseAnonKey = supabaseEnv.SUPABASE_PUBLISHABLE_KEY
    const supabaseServiceKey = supabaseEnv.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL missing!')
    }

    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_PUBLISHABLE_KEY missing!')
    }

    // Create client with anon key (for RLS-protected operations)
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header('Cookie') ?? '').map(cookie => ({
            name: cookie.name,
            value: cookie.value ?? ''
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(c, name, value, options as any)
          })
        },
      },
    })

    // Create service role client (bypasses RLS, for user creation)
    let supabaseService: SupabaseClient | null = null
    if (supabaseServiceKey) {
      supabaseService = createClient(supabaseUrl, supabaseServiceKey)
    }

    c.set('supabase', supabase)
    if (supabaseService) {
      c.set('supabaseService', supabaseService)
    }

    await next()
  }
}
