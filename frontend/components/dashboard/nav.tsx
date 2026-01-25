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
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-2xl shadow-lg shadow-black/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <Link 
            href="/dashboard" 
            className="group flex items-center gap-3 text-xl font-extrabold tracking-tight"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="text-white"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                  <circle cx="17.5" cy="17.5" r="3.5" fill="currentColor" />
                </svg>
              </div>
            </div>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-pink-700 transition-all">
              Routine
            </span>
          </Link>
          
          {/* Enhanced Navigation */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 scale-105'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </Link>
              )
            })}
            
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-3" />
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all border border-transparent hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
