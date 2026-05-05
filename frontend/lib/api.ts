import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Shared backend fetcher.
 * Adds the Supabase JWT when a user is signed in and returns typed JSON.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Normalize HeadersInit so callers can pass custom headers safely.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (
    options.headers &&
    typeof options.headers === 'object' &&
    !Array.isArray(options.headers) &&
    !(options.headers instanceof Headers)
  ) {
    Object.assign(headers, options.headers as Record<string, string>)
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}
