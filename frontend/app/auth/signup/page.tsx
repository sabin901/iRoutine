'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BatteryMedium, Clock3, Eye, EyeOff, LineChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { clearPreviewSession, isDemoMode } from '@/lib/env'
import { clearDemoWorkspace } from '@/lib/demo-data'
import { getErrorMessage } from '@/lib/errors'

const signupImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1700&q=90'

const activationCards = [
  { label: 'Today', value: '4.9h focus', Icon: Clock3, color: '#0ea5e9', bars: [72, 54, 86] },
  { label: 'Energy', value: '4/5 steady', Icon: BatteryMedium, color: '#10b981', bars: [64, 78, 70] },
  { label: 'Insight', value: 'Protect AM', Icon: LineChart, color: '#f59e0b', bars: [42, 68, 58] },
]

function MiniBars({ bars, color }: { bars: number[]; color: string }) {
  return (
    <div className="mb-4 flex h-8 items-end gap-1.5" aria-hidden="true">
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

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      clearPreviewSession()

      if (isDemoMode()) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }, { onConflict: 'id' })
      }

      if (data.session) {
        clearDemoWorkspace()
        router.push('/dashboard')
        router.refresh()
        return
      }

      setNotice('Account created. Check your email to confirm it, then sign in from this device.')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to create account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${signupImage}')` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.68)_54%,rgba(2,6,23,0.28)_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">
            <Link href="/" className="w-fit text-xl font-bold text-white">iRoutine</Link>

            <div className="max-w-xl">
              <div className="mb-8 h-1.5 w-20 rounded-full bg-white/80" aria-hidden="true" />
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Start with one day, then let the pattern teach you.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-200">
                Create your workspace and land directly in the dashboard with onboarding that guides first activation.
              </p>

              <div className="mt-8 rounded-3xl border border-white/18 bg-white/12 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-3">
                  {activationCards.map(({ label, value, Icon, color, bars }) => (
                    <div key={label} className="rounded-2xl bg-white p-3">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <MiniBars bars={bars} color={color} />
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100" style={{ color }}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-500">{label}</div>
                      <div className="mt-1 text-sm font-bold text-slate-950">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-slate-950 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                    <span className="h-1.5 w-8 rounded-full bg-emerald-300" aria-hidden="true" />
                    <span>First activation path</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    Plan the day, log reality, capture one interruption, and leave feedback. The dashboard becomes useful immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 sm:px-8">
          <div className="w-full max-w-[480px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="text-xl font-bold text-white">iRoutine</Link>
              <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white">Sign in</Link>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
              <div className="mb-8">
                <div className="mb-6 h-1.5 w-16 rounded-full bg-sky-600" aria-hidden="true" />
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Create your operating system</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Start in demo mode instantly, or connect Supabase credentials for a real account-backed workspace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}
                {notice && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {notice}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-800">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Your name"
                  />
                </div>

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
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-950 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="At least 8 characters"
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
                  {loading ? 'Creating account...' : 'Create account'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>Already have an account?</span>
                <Link href="/auth/login" className="font-bold text-sky-700 hover:text-sky-800">
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
