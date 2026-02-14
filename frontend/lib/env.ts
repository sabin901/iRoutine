/**
 * Environment and runtime mode helpers.
 * Use these instead of repeating NEXT_PUBLIC_SUPABASE_URL checks.
 */

/** True when Supabase is not configured (demo mode: localStorage, no real auth). */
export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return !url || url.includes('placeholder')
}

/** True when running in production build. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
