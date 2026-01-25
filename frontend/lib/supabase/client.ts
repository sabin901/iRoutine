/**
 * Supabase Client Singleton
 * ==========================
 * 
 * Creates and manages a single Supabase client instance for the frontend.
 * Uses singleton pattern to prevent multiple client instances (which causes
 * "Multiple GoTrueClient instances detected" errors).
 * 
 * The client is used for:
 * - Authentication (sign in, sign up, sign out)
 * - Direct database queries (when RLS allows)
 * - Real-time subscriptions
 * 
 * Uses @supabase/ssr for Next.js App Router compatibility.
 */

import { createBrowserClient } from '@supabase/ssr'

// Singleton instance - only create once
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

/**
 * Get or create the Supabase client instance.
 * 
 * Returns the same instance on every call (singleton pattern).
 * This prevents multiple client instances which can cause auth issues.
 * 
 * @returns Supabase client instance configured for browser use
 */
export function createClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Get configuration from environment variables
  // NEXT_PUBLIC_ prefix makes these available in the browser
  // Fallback to placeholder values for development
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  // Create browser client (handles cookies, SSR, etc.)
  // This client uses the anon key (safe for frontend)
  // Row Level Security (RLS) ensures users can only access their own data
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}
