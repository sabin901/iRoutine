'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Home, BarChart3, Settings, LogOut, DollarSign, CalendarCheck } from 'lucide-react'

export function DashboardNav({ user }: { user: User }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

    if (isPlaceholder) {
      router.push('/')
      router.refresh()
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Today', icon: Home },
    { href: '/dashboard/finances', label: 'Finances', icon: DollarSign },
    { href: '/dashboard/planner', label: 'Planner', icon: CalendarCheck },
    { href: '/dashboard/insights', label: 'Insights', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-lg font-semibold text-slate-800"
          >
            <span className="text-sky-600">iRoutine</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
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
