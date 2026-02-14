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

const gradientStyles: Record<string, string> = {
  blue: 'bg-sky-50 border-sky-100 text-sky-600',
  purple: 'bg-violet-50 border-violet-100 text-violet-600',
  orange: 'bg-amber-50 border-amber-100 text-amber-600',
  green: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  primary: 'bg-sky-50 border-sky-100 text-sky-600',
  success: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  warning: 'bg-amber-50 border-amber-100 text-amber-600',
  danger: 'bg-rose-50 border-rose-100 text-rose-600',
  neutral: 'bg-slate-100 border-slate-200 text-slate-600',
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
  const iconStyle = gradientStyles[gradient] || gradientStyles.primary

  return (
    <div className={`card card-hover p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl border ${iconStyle}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 ${
            trend.direction === 'up' ? 'bg-emerald-50 text-emerald-700' :
            trend.direction === 'down' ? 'bg-rose-50 text-rose-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.value > 0 && `${Math.abs(trend.value)}%`}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">{value}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
