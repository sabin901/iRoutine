'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/types'
import { format, subDays, startOfDay, parseISO, isSameDay, differenceInDays } from 'date-fns'
import { Flame, Calendar, Target } from 'lucide-react'

export function StreaksPanel() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        setActivities(storedActivities)
        calculateStreaks(storedActivities)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(365) // Last year

      setActivities(activitiesData || [])
      calculateStreaks(activitiesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreaks = (allActivities: Activity[]) => {
    if (allActivities.length === 0) {
      setStreak(0)
      setLongestStreak(0)
      return
    }

    // Get unique days with activities
    const daysWithActivity = new Set<string>()
    allActivities.forEach(a => {
      const date = format(parseISO(a.start_time), 'yyyy-MM-dd')
      daysWithActivity.add(date)
    })

    const sortedDays = Array.from(daysWithActivity)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    // Calculate current streak
    let currentStreak = 0
    const today = startOfDay(new Date())
    
    for (let i = 0; i < sortedDays.length; i++) {
      const day = startOfDay(sortedDays[i])
      const expectedDay = startOfDay(subDays(today, i))
      
      if (isSameDay(day, expectedDay)) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 1

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDay = startOfDay(sortedDays[i - 1])
      const currDay = startOfDay(sortedDays[i])
      const daysDiff = differenceInDays(prevDay, currDay)

      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    setStreak(currentStreak)
    setLongestStreak(longestStreak)
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
          <div className="h-16 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
          <Flame className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Streaks</h2>
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg">
          <div className="relative z-10">
            <div className="text-sm font-semibold text-amber-100 mb-2 uppercase tracking-wide">Current Streak</div>
            <div className="text-5xl font-bold mb-1">{streak}</div>
            <div className="text-sm text-amber-100 font-medium">days in a row</div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Longest Streak</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{longestStreak}</div>
          </div>
          <div className="text-xs text-slate-500 mt-1">Your best run</div>
        </div>

        {streak > 0 && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
            <div className="text-xs text-sky-700">
              🔥 Keep it up! You&apos;re on a {streak}-day streak. Log an activity today to continue.
            </div>
          </div>
        )}

        {streak === 0 && activities.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-xs text-slate-600">Start a new streak by logging an activity today!</div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500">Log activities to start building your streak!</div>
          </div>
        )}
      </div>
    </div>
  )
}
