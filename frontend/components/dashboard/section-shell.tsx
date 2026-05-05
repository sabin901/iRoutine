import type React from 'react'
import type { LucideIcon } from 'lucide-react'

export function PageHeader({
  icon: _Icon,
  section,
  title,
  description,
  action,
  children,
}: {
  icon?: LucideIcon
  section: string
  title: string
  description: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="card animate-slide-up overflow-hidden">
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_32%),#ffffff] p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-16 w-1.5 shrink-0 rounded-full bg-sky-500 shadow-[0_0_0_5px_rgba(14,165,233,0.08)]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="section-label mb-1">/ {section}</p>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
            </div>
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
        </div>
      </div>
      {children ? <div className="bg-slate-50/70 p-4 sm:p-5 lg:p-6">{children}</div> : null}
    </div>
  )
}

export function InsightStrip({
  items,
}: {
  items: Array<{
    label: string
    value: string
    tone?: 'sky' | 'emerald' | 'amber' | 'red' | 'slate'
  }>
}) {
  const tones = {
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    red: 'border-red-100 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border px-4 py-3 shadow-sm shadow-slate-900/[0.015] ${tones[item.tone || 'slate']}`}>
          <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">{item.label}</p>
          <p className="mt-1 text-sm font-semibold leading-5">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon: _Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
