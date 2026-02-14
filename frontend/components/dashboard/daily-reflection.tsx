/**
 * Daily Reflection Component
 * ==========================
 * 
 * Allows users to reflect on their day by answering four questions:
 * 1. What worked? - What went well today?
 * 2. What didn't? - What didn't go as planned?
 * 3. Why? - Why did things go well or poorly?
 * 4. Adjustment - What will you do differently tomorrow?
 * 
 * Purpose:
 * - Build self-awareness
 * - Identify patterns in daily life
 * - Guide continuous improvement
 * - Connect actions to outcomes
 * 
 * Data Flow:
 * 1. On mount: Loads today's reflection if it exists
 * 2. User fills in text areas
 * 3. On save: Creates or updates today's reflection
 */

'use client'

import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { DailyReflection } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/toast-context'

// Backend API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function DailyReflectionComponent() {
  // State for today's reflection (if it exists)
  const [reflection, setReflection] = useState<DailyReflection | null>(null)
  
  // Loading state: true while fetching today's reflection
  const [loading, setLoading] = useState(true)
  
  // Saving state: true while saving to prevent duplicate submissions
  const [saving, setSaving] = useState(false)
  
  // Form state - four reflection questions
  const [whatWorked, setWhatWorked] = useState('')      // What went well?
  const [whatDidnt, setWhatDidnt] = useState('')        // What didn't go well?
  const [why, setWhy] = useState('')                     // Why did it happen?
  const [adjustment, setAdjustment] = useState('')      // What will you change?
  
  const supabase = createClient()
  const toast = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTodayReflection()
  }, [])

  const loadTodayReflection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`${API_URL}/api/reflections/daily/today`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setReflection(data)
          setWhatWorked(data.what_worked || '')
          setWhatDidnt(data.what_didnt || '')
          setWhy(data.why || '')
          setAdjustment(data.adjustment || '')
        }
      }
    } catch (error) {
      console.error('Error loading reflection:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save daily reflection to the backend.
   * 
   * This uses POST /api/reflections/daily which implements upsert behavior:
   * - If today's reflection exists, it updates it
   * - If no reflection exists, it creates a new one
   * 
   * Only one reflection per day per user (enforced by database UNIQUE constraint).
   * All fields are optional - users can answer as many or as few questions as they want.
   */
  const saveReflection = async () => {
    setSaving(true)  // Prevent duplicate submissions
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Send POST request to create/update reflection
      // Backend endpoint: POST /api/reflections/daily
      const response = await fetch(`${API_URL}/api/reflections/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          // All fields are optional - convert empty strings to null
          what_worked: whatWorked || null,
          what_didnt: whatDidnt || null,
          why: why || null,
          adjustment: adjustment || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReflection(data)
        toast.success('Reflection saved')
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
      toast.error('Failed to save reflection')
    } finally {
      setSaving(false)  // Always reset saving state
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-hover p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
          <BookOpen className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Daily Reflection</h3>
          <p className="text-sm text-slate-500">Reflect on your day in a few minutes</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
          <span className="text-lg">✨</span>
          What worked today?
        </label>
        <textarea
          value={whatWorked}
          onChange={(e) => setWhatWorked(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
          placeholder="What went well today? What made you feel accomplished?"
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
          <span className="text-lg">🤔</span>
          What didn&apos;t work?
        </label>
        <textarea
          value={whatDidnt}
          onChange={(e) => setWhatDidnt(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
          placeholder="What could have been better? What challenges did you face?"
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
          <span className="text-lg">💭</span>
          Why? (Optional)
        </label>
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
          placeholder="Why do you think this happened? What patterns do you notice?"
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <label className="flex text-sm font-semibold text-slate-700 mb-3 items-center gap-2">
          <span className="text-lg">🎯</span>
          One adjustment for tomorrow
        </label>
        <textarea
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
          placeholder="What will you do differently? What's one small change you'll make?"
        />
      </div>

      <button
        onClick={saveReflection}
        disabled={saving}
        className="w-full px-6 py-3.5 btn-primary rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Save Reflection
          </>
        )}
      </button>

      {reflection && (
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Last saved: {new Date(reflection.updated_at).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}
