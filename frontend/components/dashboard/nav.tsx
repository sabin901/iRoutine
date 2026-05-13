'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearPreviewSession, isDemoMode } from '@/lib/env'
import { CalendarDays, Home, LineChart, LogOut, Settings, UserRound, WalletCards } from 'lucide-react'

export type DashboardUser = {
  id: string
  email?: string | null
  user_metadata?: { name?: string }
}

export function DashboardNav({ user }: { user: DashboardUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const displayName =
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Demo User'

  const handleSignOut = async () => {
    clearPreviewSession()

    if (isDemoMode()) {
      router.push('/')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Today', Icon: Home },
    { href: '/dashboard/finances', label: 'Finances', Icon: WalletCards },
    { href: '/dashboard/planner', label: 'Planner', Icon: CalendarDays },
    { href: '/dashboard/insights', label: 'Insights', Icon: LineChart },
    { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.02] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-col gap-2 py-2 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-0">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5 text-lg font-semibold text-slate-800"
          >
            <span className="text-sky-600">iRoutine</span>
          </Link>

          <div className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto pb-1 sm:mx-0 sm:pb-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.Icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <div className="mx-2 hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 md:flex">
              <UserRound className="h-4 w-4 text-slate-500" />
              <span className="max-w-28 truncate">{displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
