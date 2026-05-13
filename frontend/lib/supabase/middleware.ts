import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './config'

const previewCookie = 'iroutine_preview'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isPublicInsightsRoute = request.nextUrl.pathname === '/dashboard/insights'
  const isPreviewRequest =
    isDashboardRoute && request.nextUrl.searchParams.get('preview') === 'true'
  const hasPreviewCookie = request.cookies.get(previewCookie)?.value === 'true'
  const wantsPreview = isPublicInsightsRoute || isPreviewRequest || (isDashboardRoute && hasPreviewCookie)

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()
  const isPlaceholder =
    supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')
  
  const createPreviewResponse = () => {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-preview-mode', 'true')

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    response.cookies.set(previewCookie, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  }

  const clearPreviewCookie = (response: NextResponse) => {
    response.cookies.set(previewCookie, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }

  if (isPlaceholder) {
    if (wantsPreview) return createPreviewResponse()

    if (process.env.NODE_ENV === 'production') {
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('error', 'auth_not_configured')
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // A real signed-in user always gets their own clean workspace, even after
  // visiting the public sample dashboard in the same browser.
  if (user && hasPreviewCookie) clearPreviewCookie(supabaseResponse)

  if (!user && wantsPreview) return createPreviewResponse()

  // Protect dashboard routes
  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (
    (request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/signup')) &&
    user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return clearPreviewCookie(NextResponse.redirect(url))
  }

  return supabaseResponse
}
