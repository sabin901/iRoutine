'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getActivationState, seedDemoWorkspace } from '@/lib/demo-data'
import { isDemoMode } from '@/lib/env'

type ActivationState = ReturnType<typeof getActivationState>

export function ActivationOnboarding() {
  const [state, setState] = useState<ActivationState | null>(null)
  const demoMode = isDemoMode()

  useEffect(() => {
    setState(getActivationState())
  }, [])

  if (!state || state.completed === state.total) return null

  const seedAndRefresh = () => {
    seedDemoWorkspace()
    window.location.reload()
  }

  return (
    <section className="mb-8 rounded-xl border border-sky-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-1 h-11 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">First activation</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Reach activation by adding enough routine data for the Insights page to say something useful.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {demoMode && (
            <button type="button" onClick={seedAndRefresh} className="btn-secondary inline-flex items-center justify-center">
              Seed demo data
            </button>
          )}
          <Link href="/dashboard/insights" className="btn-primary inline-flex items-center justify-center gap-2">
            View insights
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {state.steps.map(step => (
          <div key={step.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">{step.label}</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${step.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                {step.done ? 'Done' : 'Open'}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${step.done ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: step.done ? '100%' : '28%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
