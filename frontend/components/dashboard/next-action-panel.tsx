'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, MessageSquare, TimerReset } from 'lucide-react'
import { getActivationState } from '@/lib/demo-data'
import { useEffect, useMemo, useState } from 'react'

const activationRoutes: Record<string, string> = {
  plan: '/dashboard/planner',
  activity: '/dashboard',
  interruption: '/dashboard',
  feedback: '/dashboard/settings',
}

export function NextActionPanel() {
  const [state, setState] = useState<ReturnType<typeof getActivationState> | null>(null)

  useEffect(() => {
    setState(getActivationState())
  }, [])

  const nextAction = useMemo(() => {
    if (!state) {
      return {
        title: 'Load today’s operating loop',
        description: 'Plan the day, log what happened, and review the pattern before tomorrow.',
        href: '/dashboard/planner',
        cta: 'Open planner',
        Icon: CalendarDays,
      }
    }

    const incomplete = state.steps.find(step => !step.done)
    if (incomplete) {
      return {
        title: incomplete.label,
        description: 'Complete the next activation step so this workspace becomes useful from real behavior.',
        href: activationRoutes[incomplete.id] || '/dashboard',
        cta: 'Continue',
        Icon: incomplete.id === 'feedback' ? MessageSquare : incomplete.id === 'interruption' ? TimerReset : CalendarDays,
      }
    }

    return {
      title: 'Review today’s decision pattern',
      description: 'You have enough data for the loop. Check the overlap between focus, energy, interruptions, and spending.',
      href: '/dashboard/insights',
      cta: 'Open insights',
      Icon: TimerReset,
    }
  }, [state])

  const Icon = nextAction.Icon

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next best action</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{nextAction.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{nextAction.description}</p>
          </div>
        </div>
        <Link href={nextAction.href} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2">
          {nextAction.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
