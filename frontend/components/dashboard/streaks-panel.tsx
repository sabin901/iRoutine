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
        setLoading(false)
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
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-100 rounded-lg w-1/2"></div>
          <div className="h-16 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Streaks</h2>
      </div>

      <div className="space-y-6">
        {/* Current Streak */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-500 to-danger-500 p-6 text-white shadow-glow-danger">
          <div className="relative z-10">
            <div className="text-sm font-semibold text-warning-100 mb-2 uppercase tracking-wide">Current Streak</div>
            <div className="text-5xl font-bold mb-1">{streak}</div>
            <div className="text-sm text-warning-100 font-medium">days in a row</div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-5 rounded-full blur-3xl"></div>
        </div>

        {/* Longest Streak */}
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Longest Streak</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{longestStreak}</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Your best run</div>
        </div>

        {/* Streak Info */}
        {streak > 0 && (
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
            <div className="text-xs text-blue-800">
              🔥 Keep it up! You&apos;re on a {streak}-day streak. Log an activity today to continue.
            </div>
          </div>
        )}

        {streak === 0 && activities.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
            <div className="text-xs text-gray-600">
              Start a new streak by logging an activity today!
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-100 text-center">
            <div className="text-xs text-gray-500">
              Log activities to start building your streak!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
