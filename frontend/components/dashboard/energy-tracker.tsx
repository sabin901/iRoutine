'use client'

import { useState, useEffect } from 'react'
import { Battery, CheckCircle2 } from 'lucide-react'
import { EnergyLog, Mood } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/toast-context'

export function EnergyTracker() {
  const [energyLog, setEnergyLog] = useState<EnergyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [stressLevel, setStressLevel] = useState(3)
  const [mood, setMood] = useState<Mood | ''>('')
  const [sleepHours, setSleepHours] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const supabase = createClient()
  const toast = useToast()

  // Load today's energy log when component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTodayEnergy()
  }, [])

  /**
   * Load today's energy log from the backend.
   * 
   * If a log exists for today, it pre-fills the form with that data.
   * If no log exists, the form shows default values.
   */
  const loadTodayEnergy = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return  // Don't load if not logged in

      // Get backend API URL from environment variables
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Fetch today's energy log
      // Backend endpoint: GET /api/energy/today
      const response = await fetch(`${API_URL}/api/energy/today`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,  // JWT token for auth
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          // Update state with loaded data
          setEnergyLog(data)
          setEnergyLevel(data.energy_level)
          setStressLevel(data.stress_level)
          setMood(data.mood || '')  // Handle null/undefined
          setSleepHours(data.sleep_hours || '')
          setNote(data.note || '')
        }
      }
    } catch (error) {
      console.error('Error loading energy log:', error)
    } finally {
      setLoading(false)  // Always stop loading, even on error
    }
  }

  /**
   * Save energy log to the backend.
   * 
   * This uses POST /api/energy which implements upsert behavior:
   * - If today's log exists, it updates it
   * - If no log exists, it creates a new one
   * 
   * Only one log per day per user (enforced by database UNIQUE constraint).
   */
  const saveEnergyLog = async () => {
    setSaving(true)  // Prevent duplicate submissions
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Send POST request to create/update energy log
      // Backend endpoint: POST /api/energy
      const response = await fetch(`${API_URL}/api/energy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          energy_level: energyLevel,  // Required: 1-5
          stress_level: stressLevel,   // Required: 1-5
          mood: mood || null,          // Optional: mood string or null
          sleep_hours: sleepHours ? parseFloat(sleepHours.toString()) : null,  // Optional: convert to number
          note: note || null,          // Optional: note string or null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnergyLog(data)
        toast.success('Energy log saved')
      }
    } catch (error) {
      console.error('Error saving energy log:', error)
      toast.error('Failed to save energy log')
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

  // Enhanced color logic with gradients
  const energyColor = energyLevel >= 4 
    ? 'text-green-600' 
    : energyLevel >= 3 
    ? 'text-yellow-500' 
    : 'text-orange-500'
  const energyGradient = energyLevel >= 4
    ? 'from-green-400 to-emerald-500'
    : energyLevel >= 3
    ? 'from-yellow-400 to-amber-500'
    : 'from-orange-400 to-red-500'
    
  const stressColor = stressLevel <= 2 
    ? 'text-blue-600' 
    : stressLevel <= 3 
    ? 'text-yellow-500' 
    : 'text-red-600'
  const stressGradient = stressLevel <= 2
    ? 'from-blue-400 to-cyan-500'
    : stressLevel <= 3
    ? 'from-yellow-400 to-orange-500'
    : 'from-red-400 to-rose-500'

  return (
    <div className="card card-hover p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <Battery className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Energy & Mood</h3>
          <p className="text-xs text-slate-500">Daily well-being</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Energy Level (1-5)</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
            className="flex-1 accent-sky-500"
          />
          <span className={`text-2xl font-bold ${energyColor}`}>{energyLevel}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-slate-700">Stress Level</label>
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stressGradient} text-white text-lg font-bold`}>
            {stressLevel}
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={stressLevel}
          onChange={(e) => setStressLevel(parseInt(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-sky-500"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #f59e0b 50%, #ef4444 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
          <span>😌 Calm</span>
          <span>😰 Stressed</span>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Mood (Optional)</label>
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value as Mood | '')}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
        >
          <option value="">Select mood...</option>
          <option value="excited">🎉 Excited</option>
          <option value="happy">😊 Happy</option>
          <option value="neutral">😐 Neutral</option>
          <option value="tired">😴 Tired</option>
          <option value="stressed">😰 Stressed</option>
          <option value="anxious">😟 Anxious</option>
          <option value="calm">😌 Calm</option>
          <option value="focused">🎯 Focused</option>
          <option value="other">🤔 Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Sleep Hours (Optional)</label>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : '')}
          className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="e.g., 7.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Note (Optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
          placeholder="Any notes about your energy today..."
        />
      </div>

      <button
        onClick={saveEnergyLog}
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
            Save Energy Log
          </>
        )}
      </button>

      {energyLog && (
        <div className="pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Energy</div>
              <div className={`text-2xl font-bold ${energyColor}`}>{energyLevel}/5</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Stress</div>
              <div className={`text-2xl font-bold ${stressColor}`}>{stressLevel}/5</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
