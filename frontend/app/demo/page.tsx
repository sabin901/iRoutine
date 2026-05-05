import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const metrics = [
  { label: 'Focus logged', value: '4h 35m', detail: 'Coding, planning, reading', color: '#0ea5e9', progress: 72 },
  { label: 'Interruptions', value: '28m', detail: 'Phone and social checks', color: '#ef4444', progress: 28 },
  { label: 'Budget left', value: '$420', detail: 'Food and transport on track', color: '#10b981', progress: 64 },
  { label: 'Tasks done', value: '7 of 9', detail: 'Two moved to tomorrow', color: '#f59e0b', progress: 78 },
]

const timeline = [
  { time: '08:30', title: 'Planning block', meta: 'Set top three outcomes' },
  { time: '09:15', title: 'Deep work', meta: 'Feature implementation, no phone' },
  { time: '12:20', title: 'Lunch and reset', meta: 'Rest logged intentionally' },
  { time: '14:10', title: 'Interruption cluster', meta: 'Phone, messages, quick context loss' },
  { time: '16:00', title: 'Finance review', meta: 'Subscription cleanup and budget check' },
]

const insights = [
  'Your cleanest work window appears before lunch.',
  'Afternoon phone checks are costing more recovery time than their duration suggests.',
  'Spending decisions look calmer on days with a written plan.',
]

const feedback = [
  { name: 'Maya', role: 'Freelance designer', quote: 'I finally saw why my afternoons kept disappearing.' },
  { name: 'Andre', role: 'Engineering student', quote: 'The planner is useful because it compares what I meant to do with what happened.' },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-sky-600">iRoutine</Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/signup" className="btn-primary inline-flex items-center justify-center gap-2">
              Start tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              A realistic workspace for understanding the day.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore how iRoutine connects focused work, interruptions, planning drift, and money decisions in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="btn-primary inline-flex items-center justify-center gap-2">
                Open live dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/signup" className="btn-secondary inline-flex items-center justify-center">
                Create account
              </Link>
            </div>
          </div>

          <div
            role="img"
            aria-label="Person working at a laptop in a calm workspace"
            className="h-[360px] w-full rounded-2xl bg-cover bg-center shadow-xl shadow-slate-200"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, detail, color, progress }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
              </div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-1.5 w-10 rounded-full bg-sky-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-950">Daily Timeline</h2>
            </div>
            <div className="space-y-3">
              {timeline.map(item => (
                <div key={`${item.time}-${item.title}`} className="grid grid-cols-[4.5rem_1fr] gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-500">{item.time}</div>
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-1.5 w-10 rounded-full bg-emerald-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-950">What iRoutine Would Flag</h2>
              </div>
              <div className="space-y-3">
                {insights.map(insight => (
                  <div key={insight} className="rounded-lg bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-1.5 w-10 rounded-full bg-amber-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-950">Beta Notes</h2>
              </div>
              <div className="space-y-4">
                {feedback.map(note => (
                  <figure key={note.name} className="border-l-2 border-sky-500 pl-4">
                    <blockquote className="text-sm leading-6 text-slate-700">&ldquo;{note.quote}&rdquo;</blockquote>
                    <figcaption className="mt-2 text-xs font-semibold text-slate-500">
                      {note.name}, {note.role}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
