'use client'

import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  gradient?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'blue' | 'purple' | 'orange' | 'green'
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  gradient = 'primary',
  className = ''
}: StatsCardProps) {
  const gradientClasses = {
    primary: 'from-blue-500 via-indigo-500 to-purple-600',
    success: 'from-emerald-400 via-green-500 to-teal-600',
    warning: 'from-amber-400 via-orange-500 to-yellow-600',
    danger: 'from-rose-400 via-red-500 to-pink-600',
    neutral: 'from-slate-500 via-gray-600 to-neutral-700',
    blue: 'from-blue-400 via-cyan-500 to-blue-600',
    purple: 'from-purple-400 via-violet-500 to-purple-600',
    orange: 'from-orange-400 via-amber-500 to-orange-600',
    green: 'from-green-400 via-emerald-500 to-green-600',
  }

  const glowClasses = {
    primary: 'shadow-lg shadow-blue-500/30',
    success: 'shadow-lg shadow-emerald-500/30',
    warning: 'shadow-lg shadow-amber-500/30',
    danger: 'shadow-lg shadow-rose-500/30',
    neutral: 'shadow-lg shadow-slate-500/20',
    blue: 'shadow-lg shadow-blue-500/30',
    purple: 'shadow-lg shadow-purple-500/30',
    orange: 'shadow-lg shadow-orange-500/30',
    green: 'shadow-lg shadow-green-500/30',
  }

  const bgGradients = {
    primary: 'from-blue-50/50 via-indigo-50/30 to-purple-50/50',
    success: 'from-emerald-50/50 via-green-50/30 to-teal-50/50',
    warning: 'from-amber-50/50 via-orange-50/30 to-yellow-50/50',
    danger: 'from-rose-50/50 via-red-50/30 to-pink-50/50',
    neutral: 'from-slate-50/50 via-gray-50/30 to-neutral-50/50',
    blue: 'from-blue-50/50 via-cyan-50/30 to-blue-50/50',
    purple: 'from-purple-50/50 via-violet-50/30 to-purple-50/50',
    orange: 'from-orange-50/50 via-amber-50/30 to-orange-50/50',
    green: 'from-green-50/50 via-emerald-50/30 to-green-50/50',
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl p-6 shadow-xl card-hover ${className}`}>
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradients[gradient]} opacity-60`}></div>
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientClasses[gradient]} ${glowClasses[gradient]} transform hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700' :
              trend.direction === 'down' ? 'bg-rose-100 text-rose-700' :
              'bg-neutral-100 text-neutral-600'
            }`}>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.value > 0 && `${Math.abs(trend.value)}%`}
            </div>
          )}
        </div>
        
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{title}</div>
          <div className="text-4xl font-extrabold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-2 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-sm font-medium text-neutral-600">{subtitle}</div>
          )}
        </div>
      </div>

      {/* Enhanced background decoration */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradientClasses[gradient]} rounded-full opacity-10 blur-3xl`}></div>
    </div>
  )
}
