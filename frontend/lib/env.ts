/**
 * Environment and runtime mode helpers.
 * Use these instead of repeating NEXT_PUBLIC_SUPABASE_URL checks.
 */

const previewCookieName = 'iroutine_preview'

export function isPreviewMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some(cookie => cookie.trim() === `${previewCookieName}=true`)
}

export function clearPreviewSession() {
  if (typeof document === 'undefined') return
  document.cookie = `${previewCookieName}=; Max-Age=0; path=/`
}

/** True when the current client should read browser-local workspace data. */
export function isDemoMode(): boolean {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ''

  return (
    isPreviewMode() ||
    !url ||
    url.includes('placeholder') ||
    !key ||
    key.includes('placeholder')
  )
}

/** True when running in production build. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
