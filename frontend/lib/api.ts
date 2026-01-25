/**
 * API Request Helper
 * ==================
 * 
 * Centralized function for making authenticated API requests to the backend.
 * 
 * Features:
 * - Automatically adds JWT token from Supabase session
 * - Handles errors consistently
 * - Type-safe with TypeScript generics
 * 
 * Usage:
 *   const activities = await apiRequest<Activity[]>('/api/activities')
 *   const result = await apiRequest('/api/activities', { method: 'POST', body: JSON.stringify(data) })
 */

import { createClient } from '@/lib/supabase/client'

// Backend API URL from environment variables
// NEXT_PUBLIC_ prefix makes this available in the browser
// Defaults to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Make an authenticated API request to the backend.
 * 
 * Automatically:
 * 1. Gets the current user's session from Supabase
 * 2. Adds the JWT token to the Authorization header
 * 3. Sets Content-Type to application/json
 * 4. Handles errors and returns typed response
 * 
 * @template T - The expected response type
 * @param endpoint - API endpoint path (e.g., '/api/activities')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise resolving to the typed response data
 * @throws Error if the request fails or returns non-OK status
 * 
 * @example
 * // GET request
 * const activities = await apiRequest<Activity[]>('/api/activities')
 * 
 * @example
 * // POST request
 * const newActivity = await apiRequest<Activity>('/api/activities', {
 *   method: 'POST',
 *   body: JSON.stringify({ category: 'Work', start_time: ..., end_time: ... })
 * })
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get Supabase client to access current session
  const supabase = createClient()
  
  // Get current user session (contains JWT token)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Build headers
  // Start with Content-Type and any custom headers from options
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add JWT token to Authorization header if user is logged in
  // Backend uses this token to identify the user
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Make the API request
  // Combine API_URL with endpoint to get full URL
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle errors
  if (!response.ok) {
    // Try to parse error message from response
    // Fallback to generic message if parsing fails
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || 'Request failed')
  }

  // Parse and return JSON response
  // TypeScript generic <T> ensures type safety
  return response.json()
}
