'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InterruptionType } from '@/lib/types'
import { format } from 'date-fns'
import { AlertCircle, Check } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'

const types: InterruptionType[] = ['Phone', 'Social Media', 'Noise', 'Other']

const typeColors: Record<InterruptionType, string> = {
  Phone: 'bg-red-50 text-red-700 border-red-200',
  'Social Media': 'bg-amber-50 text-amber-700 border-amber-200',
  Noise: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function InterruptionForm() {
  const [type, setType] = useState<InterruptionType>('Other')
  const [time, setTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [endTime, setEndTime] = useState(format(new Date(Date.now() + 15 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"))
  const [duration, setDuration] = useState(15) // minutes
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  // Update end time when duration changes
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration)
    const startTimeObj = new Date(time)
    const newEndTime = new Date(startTimeObj.getTime() + newDuration * 60 * 1000)
    setEndTime(format(newEndTime, "yyyy-MM-dd'T'HH:mm"))
  }

  // Update duration when times change
  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    const startTimeObj = new Date(newTime)
    const endTimeObj = new Date(endTime)
    const newDuration = Math.round((endTimeObj.getTime() - startTimeObj.getTime()) / 1000 / 60)
    if (newDuration > 0) {
      setDuration(newDuration)
    }
  }

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime)
    const startTimeObj = new Date(time)
    const endTimeObj = new Date(newEndTime)
    const newDuration = Math.round((endTimeObj.getTime() - startTimeObj.getTime()) / 1000 / 60)
    if (newDuration > 0) {
      setDuration(newDuration)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        const startTimeObj = new Date(time)
        const endTimeObj = new Date(endTime)
        const calculatedDuration = Math.round((endTimeObj.getTime() - startTimeObj.getTime()) / 1000 / 60)
        
        interruptions.push({
          id: Date.now().toString(),
          user_id: 'demo-user',
          activity_id: null,
          time: startTimeObj.toISOString(),
          end_time: endTimeObj.toISOString(),
          duration_minutes: calculatedDuration,
          type,
          note: note.trim() || null,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('routine_interruptions', JSON.stringify(interruptions))
        setSuccess(true)
        setNote('')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startTimeObj = new Date(time)
      const endTimeObj = new Date(endTime)
      const calculatedDuration = Math.round((endTimeObj.getTime() - startTimeObj.getTime()) / 1000 / 60)

      const { error } = await supabase.from('interruptions').insert({
        user_id: user.id,
        type,
        time: startTimeObj.toISOString(),
        end_time: endTimeObj.toISOString(),
        duration_minutes: calculatedDuration,
        note: note.trim() || null,
      })

      if (error) throw error

      setSuccess(true)
      setNote('')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'Failed to log interruption')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-hover p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Log Interruption</h2>
          <p className="text-xs text-slate-500">Track distractions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  type === t
                    ? `${typeColors[t]} ring-2 ring-offset-1 ring-offset-white ring-red-400`
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Start Time</label>
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Duration: {duration} minutes</label>
          <input
            type="range"
            min="1"
            max="120"
            value={duration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1m</span>
            <span>60m</span>
            <span>120m</span>
          </div>
        </div>

        {duration > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-1">Interruption Duration</div>
            <div className="text-lg font-semibold text-slate-900">
              {Math.floor(duration / 60) > 0 && `${Math.floor(duration / 60)}h `}
              {duration % 60}m
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
            placeholder="What interrupted you?"
            maxLength={200}
          />
          <div className="text-xs text-slate-500 mt-1 text-right">{note.length} / 200</div>
        </div>

        <button
          type="submit"
          disabled={loading || duration <= 0}
          className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            success ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'btn-primary'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Logging...</span>
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4" />
              <span>Logged!</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Log Interruption</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
