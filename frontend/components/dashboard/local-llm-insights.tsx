'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Clock3, RefreshCw, ShieldCheck, Target } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { ensureDemoWorkspaceSeeded } from '@/lib/demo-data'
import { isDemoMode } from '@/lib/env'
import { getErrorMessage } from '@/lib/errors'
import type { Activity, Interruption, LocalLlmInsight } from '@/lib/types'

const setupSteps = [
  'Connect a private analysis endpoint from Settings when you are ready to use your own infrastructure.',
  'Keep routine, finance, planner, and reflection data synced so the review has enough context.',
  'Refresh after major logging sessions to regenerate recommendations from the latest workspace state.',
]

function minutesBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(diff / 60000, 0)
}

function readDemoInsight(): LocalLlmInsight {
  ensureDemoWorkspaceSeeded()
  const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]') as Activity[]
  const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]') as Interruption[]
  const focusMinutes = activities
    .filter(activity => activity.work_type === 'deep')
    .reduce((total, activity) => total + minutesBetween(activity.start_time, activity.end_time), 0)
  const interruptionMinutes = interruptions.reduce((total, interruption) => total + (interruption.duration_minutes ?? 0), 0)
  const recentCategories = Array.from(new Set(activities.slice(0, 8).map(activity => activity.category)))
  const recentInterruptionTypes = Array.from(new Set(interruptions.map(interruption => interruption.type)))

  return {
    enabled: true,
    provider: 'Private workspace review',
    model: 'Routine pattern analyst',
    summary:
      `Workspace review: you logged ${(focusMinutes / 60).toFixed(1)} hours of deep work and ${activities.length} total activity blocks. ` +
      'The strongest pattern is clear: planning before 8 AM leads into the cleanest focus window from 9:00-11:35. ' +
      `The weak spot is the afternoon, where ${interruptionMinutes} interruption minutes cluster around support replies, lower energy, and avoidable spending. ` +
      'Tomorrow should protect the morning build block, batch messages earlier, and use the finance review to cancel the renewal that did not feel worth it.',
    actions: [
      'Block 9:00-11:30 for deep work before opening messages.',
      'Move support and inbox work into one 1:00 PM admin window.',
      'Put the phone away before the second coding block.',
      'Cancel the unused subscription during the evening expense check.',
    ],
    snapshot: {
      generated_at: new Date().toISOString(),
      activity_count: activities.length,
      interruption_count: interruptions.length,
      focus_hours: Number((focusMinutes / 60).toFixed(2)),
      deterministic_insights: {
        peak_focus_window: '9:00 AM - 11:35 AM',
        distraction_hotspot: '2:00 PM - 4:00 PM',
        consistency_score: 82,
        balance_ratio: 68,
        suggestion: 'Keep deep work before lunch and batch communication after a planned reset.',
      },
      recent_activity_categories: recentCategories,
      recent_interruption_types: recentInterruptionTypes,
    },
  }
}

export function LocalLlmInsights() {
  const [insight, setInsight] = useState<LocalLlmInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const demoMode = useMemo(() => isDemoMode(), [])

  const loadInsight = useCallback(async () => {
    if (demoMode) {
      setInsight(readDemoInsight())
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest<LocalLlmInsight>('/api/insights/llm')
      setInsight(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Pattern review is unavailable.'))
    } finally {
      setLoading(false)
    }
  }, [demoMode])

  useEffect(() => {
    loadInsight()
  }, [loadInsight])

  const status = insight?.enabled
    ? 'Review ready'
    : demoMode
    ? 'Review ready'
    : 'Ready to configure'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Pattern Review</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Private analysis of your routine, money, planner, energy, and reflection data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadInsight}
          disabled={demoMode || loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Status
          </div>
          <div className="mt-2 text-base font-semibold text-slate-950">{status}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Target className="h-4 w-4" />
            Review scope
          </div>
          <div className="mt-2 break-words text-base font-semibold text-slate-950">
            {demoMode ? 'Full workspace' : insight?.model ?? 'Configured privately'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Clock3 className="h-4 w-4" />
            Latest run
          </div>
          <div className="mt-2 break-words text-sm font-semibold text-slate-950">
            {insight ? new Date(insight.snapshot.generated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not run yet'}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-20 animate-pulse rounded bg-slate-200" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && insight?.enabled && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 text-sm font-semibold text-emerald-950">Recommended next moves</div>
          <p className="whitespace-pre-line text-sm leading-6 text-emerald-900">{insight.summary}</p>
          {insight.actions.length > 0 && (
            <div className="mt-4 grid gap-2">
              {insight.actions.map(action => (
                <div key={action} className="flex items-start gap-3 rounded-lg bg-white/70 p-3 text-sm font-medium text-emerald-950">
                  <span className="mt-2 h-1.5 w-6 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!demoMode && !loading && !insight?.enabled && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-950">Setup checklist</div>
          <div className="space-y-2">
            {setupSteps.map(step => (
              <div key={step} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-2 h-1.5 w-5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
