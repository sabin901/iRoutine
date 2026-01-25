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
  
  // Get Supabase client for authentication
  const supabase = createClient()

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
        setReflection(data)  // Update state with saved data
        alert('Reflection saved!')
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
      alert('Failed to save reflection')
    } finally {
      setSaving(false)  // Always reset saving state
    }
  }

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 space-y-6 card-hover overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/30">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Daily Reflection</h3>
          <p className="text-sm text-neutral-600 font-medium">Take 2 minutes to reflect on your day</p>
        </div>
      </div>

      {/* What Worked - Enhanced */}
      <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
        <label className="flex text-sm font-bold text-green-800 mb-3 items-center gap-2">
          <span className="text-lg">✨</span>
          What worked today?
        </label>
        <textarea
          value={whatWorked}
          onChange={(e) => setWhatWorked(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-neutral-700 transition-all resize-none"
          placeholder="What went well today? What made you feel accomplished?"
        />
      </div>

      {/* What Didn't - Enhanced */}
      <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200">
        <label className="flex text-sm font-bold text-orange-800 mb-3 items-center gap-2">
          <span className="text-lg">🤔</span>
          What didn&apos;t work?
        </label>
        <textarea
          value={whatDidnt}
          onChange={(e) => setWhatDidnt(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white font-medium text-neutral-700 transition-all resize-none"
          placeholder="What could have been better? What challenges did you face?"
        />
      </div>

      {/* Why - Enhanced */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
        <label className="flex text-sm font-bold text-blue-800 mb-3 items-center gap-2">
          <span className="text-lg">💭</span>
          Why? (Optional)
        </label>
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-neutral-700 transition-all resize-none"
          placeholder="Why do you think this happened? What patterns do you notice?"
        />
      </div>

      {/* Adjustment - Enhanced */}
      <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
        <label className="flex text-sm font-bold text-purple-800 mb-3 items-center gap-2">
          <span className="text-lg">🎯</span>
          One adjustment for tomorrow
        </label>
        <textarea
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium text-neutral-700 transition-all resize-none"
          placeholder="What will you do differently? What's one small change you'll make?"
        />
      </div>

      {/* Save Button - Enhanced */}
      <button
        onClick={saveReflection}
        disabled={saving}
        className="relative w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
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
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {reflection && (
        <div className="pt-6 border-t-2 border-gradient-to-r from-blue-200 to-purple-200">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Last saved: {new Date(reflection.updated_at).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}
