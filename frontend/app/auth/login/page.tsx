'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BatteryMedium, Clock3, Eye, EyeOff, LineChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/env'
import { getErrorMessage } from '@/lib/errors'

const loginImage =
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1700&q=90'

const resumeItems = [
  { label: 'Today', value: '2 focus blocks ready', Icon: Clock3, color: '#0ea5e9', bars: [70, 46, 82] },
  { label: 'Insights', value: 'Morning work is strongest', Icon: LineChart, color: '#10b981', bars: [38, 68, 90] },
  { label: 'Energy', value: 'Reflection still open', Icon: BatteryMedium, color: '#f59e0b', bars: [76, 62, 58] },
]

function MiniBars({ bars, color }: { bars: number[]; color: string }) {
  return (
    <div className="flex h-9 w-12 items-end gap-1.5" aria-hidden="true">
      {bars.map((bar, index) => (
        <div
          key={`${bar}-${index}`}
          className="w-2 rounded-t-sm"
          style={{ height: `${bar}%`, backgroundColor: color }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isDemoMode()) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to sign in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 sm:px-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-10 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-white">iRoutine</Link>
              <Link href="/auth/signup" className="text-sm font-semibold text-slate-300 hover:text-white">Create account</Link>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
              <div className="mb-8">
                <div className="mb-6 h-1.5 w-16 rounded-full bg-sky-600" aria-hidden="true" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Return to your dashboard and keep the loop moving from today&apos;s real data.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-800">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-800">Password</label>
                  <div className="relative mt-2">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="Your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(value => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>New to iRoutine?</span>
                <Link href="/auth/signup" className="font-bold text-sky-700 hover:text-sky-800">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${loginImage}')` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.68)_54%,rgba(2,6,23,0.24)_100%)]" />
          <div className="relative flex h-full flex-col justify-end p-12 xl:p-14">
            <div className="max-w-xl">
              <div className="mb-8 h-1.5 w-20 rounded-full bg-white/80" aria-hidden="true" />
              <h2 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Pick up exactly where your last pattern left off.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-200">
                The dashboard opens with today&apos;s plan, recent interruptions, active goals, and weekly insight signals ready to review.
              </p>

              <div className="mt-8 rounded-3xl border border-white/18 bg-white/12 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="grid gap-3">
                  {resumeItems.map(({ label, value, Icon, color, bars }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4">
                      <MiniBars bars={bars} color={color} />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100" style={{ color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">{label}</div>
                        <div className="text-sm font-bold text-slate-950">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-950 p-4 text-sm font-semibold text-slate-300">
                  <span className="h-1.5 w-8 rounded-full bg-emerald-300" aria-hidden="true" />
                  <span>Demo mode still lets you enter instantly on this machine.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
