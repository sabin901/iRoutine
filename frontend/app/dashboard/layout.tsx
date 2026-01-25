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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 bg-fixed">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10">
          <DashboardNav user={user} />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </div>
  )
}
