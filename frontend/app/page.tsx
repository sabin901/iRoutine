import Link from 'next/link'
import { ArrowRight, BatteryMedium, CalendarRange, Clock3, Layers3, Target, WalletCards } from 'lucide-react'

const heroImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90'

const previewStats = [
  { label: 'Focus', value: '6.7h', Icon: Clock3, accent: 'bg-sky-500', points: [18, 14, 12, 7, 10] },
  { label: 'Energy', value: '4/5', Icon: BatteryMedium, accent: 'bg-emerald-500', points: [15, 11, 9, 12, 8] },
  { label: 'Cashflow', value: '+$4k', Icon: WalletCards, accent: 'bg-amber-500', points: [16, 15, 13, 10, 6] },
]

const dayRows = [
  { time: '07:30', label: 'Plan', detail: 'Set outcomes before the day gets noisy', tone: 'bg-sky-50 text-sky-800' },
  { time: '09:00', label: 'Deep work', detail: 'Product analytics and activation pass', tone: 'bg-emerald-50 text-emerald-800' },
  { time: '14:20', label: 'Risk window', detail: 'Messages and stress spending start to cluster', tone: 'bg-rose-50 text-rose-800' },
]

const proofItems = [
  { label: 'Day mapped', value: '6.7h focus', Icon: Layers3, progress: 92 },
  { label: 'Rhythm', value: '11 logged blocks', Icon: CalendarRange, progress: 84 },
  { label: 'Next move', value: 'Protect 2-4 PM', Icon: Target, progress: 76 },
]

function MiniTrend({ points, color }: { points: number[]; color: string }) {
  const width = 72
  const height = 26
  const step = width / Math.max(points.length - 1, 1)
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${point}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative min-h-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${heroImage}')` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.82)_100%)]" />
          <div className="relative flex min-h-screen flex-col justify-between px-6 py-9 sm:px-10 lg:px-12 xl:px-14">
            <header className="flex items-center justify-between gap-3">
              <Link href="/" className="text-xl font-bold text-white">iRoutine</Link>
              <div className="flex shrink-0 items-center gap-2 lg:hidden">
                <Link href="/auth/login" className="text-xs font-semibold text-white sm:text-sm">Sign in</Link>
                <Link href="/auth/signup" className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-950 sm:px-4 sm:text-sm">Start</Link>
              </div>
            </header>

            <div className="max-w-2xl pb-7">
              <div className="mb-8 h-1.5 w-20 rounded-full bg-white/80" aria-hidden="true" />
              <h1 className="text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Build the operating system for your actual day.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-100">
                iRoutine turns a full day of activity, spending, planning, energy, and reflection into useful decisions for tomorrow.
              </p>

              <div className="mt-9 grid max-w-xl gap-3">
                {proofItems.map((item, index) => {
                  const Icon = item.Icon
                  return (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl shadow-slate-950/20 backdrop-blur">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white ring-1 ring-white/15">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{item.label}</span>
                        </div>
                        <p className="mt-2 text-sm font-bold leading-5">{item.value}</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                          <div className="h-full rounded-full bg-white/80" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 sm:px-8">
          <div className="w-full max-w-[560px]">
            <div className="mb-8 hidden items-center justify-end gap-4 lg:flex">
              <Link href="/demo" className="text-sm font-semibold text-slate-300 hover:text-white">Demo</Link>
              <Link href="/dashboard/insights" className="text-sm font-semibold text-slate-300 hover:text-white">Insights</Link>
              <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white">Sign in</Link>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-5">
                <div>
                  <div className="mb-6 h-1.5 w-16 rounded-full bg-sky-600" aria-hidden="true" />
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">See the finished workspace</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                    Open a realistic workspace with focus, planning, spending, energy, and pattern analysis already connected.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {previewStats.map(({ label, value, Icon, accent, points }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${accent}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <MiniTrend points={points} color={accent.includes('emerald') ? '#10b981' : accent.includes('amber') ? '#f59e0b' : '#0ea5e9'} />
                    </div>
                    <div className="text-xs font-semibold text-slate-500">{label}</div>
                    <div className="mt-1 text-lg font-bold text-slate-950">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {dayRows.map(row => (
                  <div key={`${row.time}-${row.label}`} className="grid grid-cols-[3.5rem_1fr] gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="pt-2 text-sm font-bold text-slate-500">{row.time}</div>
                    <div className="min-w-0">
                      <span className={`inline-flex rounded-xl px-3 py-2 text-sm font-bold ${row.tone}`}>{row.label}</span>
                      <div className="mt-2 text-sm font-semibold leading-5 text-slate-700">{row.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                <div className="mb-2 text-sm font-bold">Data analyst preview</div>
                <p className="text-sm leading-6 text-slate-300">
                  Best focus happens before lunch. The highest-risk window is 2-4 PM, where interruptions, lower energy, and unplanned spending overlap.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-sky-700">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo" className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-50">
                  View demo workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
