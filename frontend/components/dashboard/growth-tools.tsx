'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarPlus, Mail, RefreshCw } from 'lucide-react'
import { getActivationState } from '@/lib/demo-data'
import type { Activity, ActivityCategory, ProductFeedback } from '@/lib/types'

function buildDigest(state: ReturnType<typeof getActivationState> | null) {
  const currentState = state ?? getActivationState()
  const focusMinutes = currentState.activities.reduce((sum: number, activity: Activity) => {
    const start = new Date(activity.start_time)
    const end = new Date(activity.end_time)
    return sum + Math.max(0, end.getTime() - start.getTime()) / 60000
  }, 0)

  const averageRating = currentState.feedback.length
    ? currentState.feedback.reduce((sum: number, item: ProductFeedback) => sum + item.rating, 0) / currentState.feedback.length
    : 0

  return [
    'iRoutine weekly digest',
    '',
    `Activation: ${currentState.completed}/${currentState.total} steps complete`,
    `Activities logged: ${currentState.activities.length}`,
    `Focus logged: ${Math.round(focusMinutes / 60 * 10) / 10}h`,
    `Interruptions logged: ${currentState.interruptions.length}`,
    `Beta feedback: ${currentState.feedback.length} notes, ${averageRating ? averageRating.toFixed(1) : 'n/a'} average rating`,
    '',
    'Suggested next adjustment:',
    currentState.interruptions.length > 0
      ? 'Protect one afternoon focus block and compare recovery time next week.'
      : 'Log one interruption so iRoutine can detect recovery patterns.',
  ].join('\n')
}

function parseIcsDate(value: string) {
  const clean = value.replace('Z', '')
  const year = clean.slice(0, 4)
  const month = clean.slice(4, 6)
  const day = clean.slice(6, 8)
  const hour = clean.slice(9, 11) || '09'
  const minute = clean.slice(11, 13) || '00'
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toISOString()
}

function importCalendarEvents(text: string) {
  const events = text.split('BEGIN:VEVENT').slice(1)
  const existing = JSON.parse(localStorage.getItem('routine_activities') || '[]')
  const imported = events.map((event, index) => {
    const summary = event.match(/SUMMARY:(.+)/)?.[1]?.trim() || 'Calendar event'
    const start = event.match(/DTSTART(?:;[^:]+)?:([^\r\n]+)/)?.[1]?.trim()
    const end = event.match(/DTEND(?:;[^:]+)?:([^\r\n]+)/)?.[1]?.trim()

    if (!start || !end) return null

    return {
      id: `calendar-${Date.now()}-${index}`,
      user_id: 'demo-user',
      category: 'Work' as ActivityCategory,
      start_time: parseIcsDate(start),
      end_time: parseIcsDate(end),
      note: summary,
      energy_cost: null,
      work_type: 'mixed',
      planned_start_time: null,
      planned_end_time: null,
      task_id: null,
      created_at: new Date().toISOString(),
    }
  }).filter(Boolean)

  localStorage.setItem('routine_activities', JSON.stringify([...existing, ...imported]))
  return imported.length
}

export function GrowthTools() {
  const [activation, setActivation] = useState<ReturnType<typeof getActivationState> | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setActivation(getActivationState())
  }, [])

  const digest = useMemo(() => activation ? buildDigest(activation) : 'Loading weekly digest...', [activation])
  const activationRate = activation ? Math.round((activation.completed / activation.total) * 100) : 0
  const averageRating = activation?.feedback.length
    ? activation.feedback.reduce((sum: number, item: ProductFeedback) => sum + item.rating, 0) / activation.feedback.length
    : 0

  const sendDigestEmail = () => {
    const href = `mailto:?subject=${encodeURIComponent('iRoutine weekly digest')}&body=${encodeURIComponent(digest)}`
    window.location.href = href
  }

  const downloadDigest = () => {
    const blob = new Blob([digest], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `iroutine-weekly-digest-${new Date().toISOString().split('T')[0]}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleCalendarImport = async (file: File | null) => {
    if (!file) return
    const count = importCalendarEvents(await file.text())
    setMessage(`Imported ${count} calendar events into the live dashboard.`)
    setActivation(getActivationState())
  }

  const refresh = () => {
    setActivation(getActivationState())
    setMessage('Founder analytics refreshed.')
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Weekly Digest</h2>
            <p className="mt-1 text-sm text-slate-600">Generate a simple weekly summary that can be emailed or downloaded.</p>
          </div>
        </div>
        <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{digest}</pre>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={sendDigestEmail} className="btn-primary inline-flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            Email digest
          </button>
          <button type="button" onClick={downloadDigest} className="btn-secondary inline-flex items-center justify-center">
            Download digest
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <CalendarPlus className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-950">Calendar Import</h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-slate-600">Import `.ics` events as activity blocks for demo-mode analysis.</p>
          <input
            type="file"
            accept=".ics,text/calendar"
            onChange={event => handleCalendarImport(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              <h2 className="text-lg font-semibold text-slate-950">Founder Analytics</h2>
            </div>
            <button type="button" onClick={refresh} aria-label="Refresh founder analytics" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Activation</div>
              <div className="mt-1 text-2xl font-bold text-slate-950">{activationRate}%</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Feedback notes</div>
              <div className="mt-1 text-2xl font-bold text-slate-950">{activation?.feedback.length ?? 0}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Average rating</div>
              <div className="mt-1 text-2xl font-bold text-slate-950">{averageRating ? averageRating.toFixed(1) : 'n/a'}</div>
            </div>
          </div>
          {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        </div>
      </div>
    </section>
  )
}
