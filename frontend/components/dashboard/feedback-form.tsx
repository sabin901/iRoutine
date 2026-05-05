'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { MessageSquare, Send, Star } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { isDemoMode } from '@/lib/env'
import { getErrorMessage } from '@/lib/errors'
import type { FeedbackProductArea, ProductFeedback } from '@/lib/types'

const areas: { label: string; value: FeedbackProductArea }[] = [
  { label: 'Overall', value: 'overall' },
  { label: 'Today', value: 'today' },
  { label: 'Finances', value: 'finances' },
  { label: 'Planner', value: 'planner' },
  { label: 'Insights', value: 'insights' },
  { label: 'Settings', value: 'settings' },
]

export function FeedbackForm() {
  const [productArea, setProductArea] = useState<FeedbackProductArea>('overall')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    setError(null)

    const payload = {
      product_area: productArea,
      rating,
      message: message.trim(),
      email: email.trim() || null,
    }

    try {
      if (isDemoMode()) {
        const stored = JSON.parse(localStorage.getItem('routine_product_feedback') || '[]')
        const feedback: ProductFeedback = {
          id: crypto.randomUUID(),
          user_id: 'demo-user',
          ...payload,
          created_at: new Date().toISOString(),
        }
        localStorage.setItem('routine_product_feedback', JSON.stringify([feedback, ...stored]))
      } else {
        await apiRequest<ProductFeedback>('/api/feedback', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setMessage('')
      setEmail('')
      setProductArea('overall')
      setRating(5)
      setStatus('Feedback saved. This is exactly the kind of signal a beta needs.')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save feedback.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Beta Feedback Loop</h2>
          <p className="mt-1 text-sm text-slate-600">
            Capture what users love, what blocks them, and which section needs work next.
          </p>
        </div>
      </div>

      <form onSubmit={submitFeedback} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Section</span>
            <select
              value={productArea}
              onChange={event => setProductArea(event.target.value as FeedbackProductArea)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {areas.map(area => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="text-sm font-semibold text-slate-700">Rating</div>
            <div className="mt-2 flex h-11 items-center gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-md p-1.5 text-amber-400 transition hover:bg-amber-50"
                  aria-label={`Rate ${value} out of 5`}
                >
                  <Star className={`h-5 w-5 ${value <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">What should we fix or double down on?</span>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            minLength={5}
            maxLength={2000}
            required
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="Example: The insights are useful, but I need a weekly email summary before I would use this daily."
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email for follow-up</span>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            type="email"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="optional@example.com"
          />
        </label>

        {status && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{status}</p>}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {saving ? 'Saving...' : 'Send feedback'}
        </button>
      </form>
    </section>
  )
}
