import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'

// Mock user for demo mode
const mockUser = {
  id: 'demo-user-id',
  email: 'demo@routine.app',
  user_metadata: {
    name: 'Demo User',
  },
} as any

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if using placeholder Supabase (authentication bypassed)
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  
  let user = mockUser
  
  if (!isPlaceholder) {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    
    if (authUser) {
      user = authUser
    } else {
      redirect('/auth/login')
    }
  }

  return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
        <DashboardNav user={user} />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
      </div>
  )
}
