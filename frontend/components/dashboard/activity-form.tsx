'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityCategory } from '@/lib/types'
import { format } from 'date-fns'
import { Plus, Check } from 'lucide-react'

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
  Study: 'bg-blue-100 text-blue-700 border-blue-200',
  Coding: 'bg-purple-100 text-purple-700 border-purple-200',
  Work: 'bg-green-100 text-green-700 border-green-200',
  Reading: 'bg-orange-100 text-orange-700 border-orange-200',
  Rest: 'bg-gray-100 text-gray-700 border-gray-200',
  Social: 'bg-pink-100 text-pink-700 border-pink-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
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
      alert(err.message || 'Failed to log activity')
    } finally {
      setLoading(false)
    }
  }

  const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60)

  return (
    <div className="relative rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl p-6 shadow-xl card-hover animate-scale-in overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 via-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="relative z-10">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-3xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/30">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Log Activity</h2>
            <p className="text-sm text-neutral-600 font-medium">Track your time and focus</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  category === cat
                    ? `${categoryColors[cat]} ring-2 ring-offset-1 ring-primary-500 shadow-soft`
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:shadow-soft'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Duration Display - Enhanced */}
        {duration > 0 && (
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-2 border-blue-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Duration</div>
              <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {Math.floor(duration / 60)}h {duration % 60}m
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            placeholder="What did you work on?"
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {note.length} / 200
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <button
          type="submit"
          disabled={loading || duration <= 0}
          className={`relative w-full rounded-xl px-6 py-4 text-base font-bold text-white transition-all overflow-hidden group ${
            success
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative z-10 flex items-center gap-2">
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
    </div>
  )
}
