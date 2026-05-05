'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clipboard, Download, Mail, Plus, Users } from 'lucide-react'
import { getActivationState } from '@/lib/demo-data'

type TesterStatus = 'invited' | 'activated' | 'retained' | 'churned'

interface BetaTester {
  id: string
  name: string
  email: string
  segment: string
  status: TesterStatus
  notes: string
  created_at: string
}

const storageKey = 'routine_beta_testers'

const seedTesters: BetaTester[] = [
  {
    id: 'beta-1',
    name: 'Maya Chen',
    email: 'maya@example.com',
    segment: 'Founder',
    status: 'retained',
    notes: 'Wants the weekly digest before Monday planning.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'beta-2',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    segment: 'Freelancer',
    status: 'activated',
    notes: 'Insight page made the afternoon risk window obvious.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'beta-3',
    name: 'Priya Shah',
    email: 'priya@example.com',
    segment: 'Student',
    status: 'invited',
    notes: 'Needs a quick-start checklist.',
    created_at: new Date().toISOString(),
  },
]

const statusStyles: Record<TesterStatus, string> = {
  invited: 'bg-slate-100 text-slate-700',
  activated: 'bg-sky-50 text-sky-700',
  retained: 'bg-emerald-50 text-emerald-700',
  churned: 'bg-rose-50 text-rose-700',
}

function loadTesters() {
  const stored = localStorage.getItem(storageKey)
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify(seedTesters))
    return seedTesters
  }

  try {
    return JSON.parse(stored) as BetaTester[]
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(seedTesters))
    return seedTesters
  }
}

function exportCsv(testers: BetaTester[]) {
  const header = ['Name', 'Email', 'Segment', 'Status', 'Notes']
  const rows = testers.map(tester => [tester.name, tester.email, tester.segment, tester.status, tester.notes])
  return [header, ...rows]
    .map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n')
}

export function BetaLaunchPanel() {
  const [testers, setTesters] = useState<BetaTester[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [segment, setSegment] = useState('Founder')
  const [notes, setNotes] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTesters(loadTesters())
    setReady(true)
  }, [])

  const metrics = useMemo(() => {
    const target = 20
    const activated = testers.filter(tester => tester.status === 'activated' || tester.status === 'retained').length
    const retained = testers.filter(tester => tester.status === 'retained').length
    const activation = testers.length ? Math.round((activated / testers.length) * 100) : 0
    const retention = testers.length ? Math.round((retained / testers.length) * 100) : 0
    const appActivation = ready ? getActivationState() : null

    return {
      recruited: testers.length,
      target,
      activated,
      retained,
      activation,
      retention,
      appActivation: appActivation ? Math.round((appActivation.completed / appActivation.total) * 100) : 0,
    }
  }, [ready, testers])

  const saveTesters = (next: BetaTester[]) => {
    setTesters(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const addTester = () => {
    if (!name.trim() || !email.trim()) return

    saveTesters([
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
        segment,
        status: 'invited',
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      },
      ...testers,
    ])
    setName('')
    setEmail('')
    setNotes('')
    setStatusMessage('Tester added to the beta list.')
  }

  const updateStatus = (id: string, status: TesterStatus) => {
    saveTesters(testers.map(tester => tester.id === id ? { ...tester, status } : tester))
  }

  const copyInvite = async () => {
    const text = [
      'Hey, I am testing iRoutine with a small beta group.',
      '',
      'It turns a full day of planning, work, interruptions, energy, spending, and reflection into a practical weekly pattern review.',
      '',
      'Could you use it for 7 days and tell me where it becomes useful, confusing, or not worth returning to?',
      '',
      'Demo: http://127.0.0.1:3000/demo',
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setStatusMessage('Beta invite copied.')
  }

  const downloadList = () => {
    const blob = new Blob([exportCsv(testers)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'iroutine-beta-testers.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Beta Launch Command Center</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Track the first 20 testers, activation, retention, and the feedback signals that decide what to build next.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyInvite} className="btn-secondary inline-flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Copy invite
          </button>
          <button type="button" onClick={downloadList} className="btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export list
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Recruited', `${metrics.recruited}/${metrics.target}`],
          ['Activated', `${metrics.activated}`],
          ['Retained', `${metrics.retained}`],
          ['Activation rate', `${metrics.activation}%`],
          ['App readiness', `${metrics.appActivation}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Add tester</h3>
          <div className="mt-4 grid gap-3">
            <input value={name} onChange={event => setName(event.target.value)} placeholder="Name" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            <input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" type="email" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            <select value={segment} onChange={event => setSegment(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
              <option>Founder</option>
              <option>Student</option>
              <option>Freelancer</option>
              <option>Operator</option>
              <option>Other</option>
            </select>
            <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="What signal do you want from this user?" rows={3} className="resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            <button type="button" onClick={addTester} className="btn-primary inline-flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Add tester
            </button>
            {statusMessage && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{statusMessage}</p>}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_9rem_4rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Tester</span>
                <span>Status</span>
                <span className="text-right">Contact</span>
              </div>
              <div className="divide-y divide-slate-100">
                {testers.map(tester => (
                  <div key={tester.id} className="grid grid-cols-[1fr_9rem_4rem] items-center gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{tester.name}</p>
                      <p className="truncate text-xs text-slate-500">{tester.segment} · {tester.notes || 'No note yet'}</p>
                    </div>
                    <select
                      value={tester.status}
                      onChange={event => updateStatus(tester.id, event.target.value as TesterStatus)}
                      className={`h-9 w-full rounded-lg border-0 px-2 text-xs font-semibold outline-none ${statusStyles[tester.status]}`}
                    >
                      <option value="invited">Invited</option>
                      <option value="activated">Activated</option>
                      <option value="retained">Retained</option>
                      <option value="churned">Churned</option>
                    </select>
                    <a href={`mailto:${tester.email}`} className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Email ${tester.name}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
