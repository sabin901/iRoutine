/**
 * Environment and runtime mode helpers.
 * Use these instead of repeating NEXT_PUBLIC_SUPABASE_URL checks.
 */

/** True when Supabase is not configured (demo mode: localStorage, no real auth). */
export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ''

  return !url || url.includes('placeholder') || !key || key.includes('placeholder')
}

/** True when running in production build. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
