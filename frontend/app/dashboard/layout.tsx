import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav, type DashboardUser } from '@/components/dashboard/nav'
import { isDemoMode } from '@/lib/env'
import { DemoWorkspaceProvider } from '@/components/dashboard/demo-workspace-provider'

// Mock user for demo / preview mode
const mockUser = {
  id: 'demo-user-id',
  email: 'demo@routine.app',
  user_metadata: {
    name: 'Demo User',
  },
} satisfies DashboardUser

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const demoMode = isDemoMode()

  // Preview is only for unauthenticated sample pages. Real auth wins below.
  const headersList = await headers()
  const cookieStore = await cookies()
  const previewRequested =
    headersList.get('x-preview-mode') === 'true' ||
    cookieStore.get('iroutine_preview')?.value === 'true'

  if (demoMode && process.env.NODE_ENV === 'production' && !previewRequested) {
    redirect('/auth/login?error=auth_not_configured')
  }

  let user: DashboardUser = mockUser
  let isPreview = previewRequested

  if (!demoMode) {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser) {
      user = authUser
      isPreview = false
    } else if (!previewRequested) {
      redirect('/auth/login')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      <DashboardNav user={user} />
      <DemoWorkspaceProvider preview={isPreview}>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </DemoWorkspaceProvider>
    </div>
  )
}
