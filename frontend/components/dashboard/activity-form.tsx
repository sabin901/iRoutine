'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityCategory } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, Check } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

const categories: ActivityCategory[] = [
  'Study',
  'Coding',
  'Work',
  'Reading',
  'Rest',
  'Social',
  'Other',
]

const categoryColors: Record<ActivityCategory, string> = {
  Study: 'bg-blue-50 text-blue-700 border-blue-200',
  Coding: 'bg-violet-50 text-violet-700 border-violet-200',
  Work: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Reading: 'bg-amber-50 text-amber-700 border-amber-200',
  Rest: 'bg-slate-100 text-slate-600 border-slate-200',
  Social: 'bg-pink-50 text-pink-700 border-pink-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function ActivityForm() {
  const [category, setCategory] = useState<ActivityCategory>('Work')
  const [startTime, setStartTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [endTime, setEndTime] = useState(
    format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        activities.push({
          id: Date.now().toString(),
          user_id: 'demo-user',
          category,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          note: note.trim() || null,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('routine_activities', JSON.stringify(activities))
        setSuccess(true)
        setNote('')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        category,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        note: note.trim() || null,
      })

      if (error) throw error

      setSuccess(true)
      setNote('')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'Failed to log activity')
    } finally {
      setLoading(false)
    }
  }

  const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60)

  return (
    <div className="card card-hover p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
          <Plus className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Log Activity</h2>
          <p className="text-xs text-slate-500">Track time and focus</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  category === cat
                    ? `${categoryColors[cat]} ring-2 ring-offset-1 ring-offset-white ring-sky-400`
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>
        </div>

        {duration > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Duration</div>
            <div className="text-xl font-bold text-slate-900">
              {Math.floor(duration / 60)}h {duration % 60}m
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
            placeholder="What did you work on?"
            maxLength={200}
          />
          <div className="text-xs text-slate-500 mt-1 text-right">{note.length} / 200</div>
        </div>

        <button
          type="submit"
          disabled={loading || duration <= 0}
          className={`w-full rounded-xl px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            success
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'btn-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging...</span>
              </>
            ) : success ? (
              <>
                <Check className="h-5 w-5" />
                <span>Logged!</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Log Activity</span>
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  )
}
