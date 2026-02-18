'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Interruption, Activity } from '@/lib/types'
import { format, subDays, startOfDay, parseISO, subWeeks } from 'date-fns'
import { calculateDailyMetrics, calculateWeeklyMetrics, getTopCostDrivers } from '@/lib/interruption-metrics'
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react'

interface WeekComparison {
  biggestIncrease: string | null
  topCostDriver: string | null
  focusWindowChange: string | null
  suggestion: string
}

export function WhatChangedThisWeek() {
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState<WeekComparison | null>(null)
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
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        
        setInterruptions(storedInterruptions)
        setActivities(storedActivities)
        calculateComparison(storedInterruptions, storedActivities)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const twoWeeksAgo = startOfDay(subWeeks(new Date(), 2))

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', twoWeeksAgo.toISOString())
        .order('time', { ascending: true })

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', twoWeeksAgo.toISOString())
        .order('start_time', { ascending: true })

      setInterruptions(interruptionsData || [])
      setActivities(activitiesData || [])
      calculateComparison(interruptionsData || [], activitiesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateComparison = (allInterruptions: Interruption[], allActivities: Activity[]) => {
    const thisWeekEnd = new Date()
    const thisWeekStart = startOfDay(subDays(thisWeekEnd, 6))
    const lastWeekEnd = subDays(thisWeekStart, 1)
    const lastWeekStart = startOfDay(subDays(lastWeekEnd, 6))

    // This week
    const thisWeekInterruptions = allInterruptions.filter((i) => {
      const time = parseISO(i.time)
      return time >= thisWeekStart && time <= thisWeekEnd
    })

    const thisWeekActivities = allActivities.filter((a) => {
      const start = parseISO(a.start_time)
      return start >= thisWeekStart && start <= thisWeekEnd
    })

    // Last week
    const lastWeekInterruptions = allInterruptions.filter((i) => {
      const time = parseISO(i.time)
      return time >= lastWeekStart && time < thisWeekStart
    })

    const lastWeekActivities = allActivities.filter((a) => {
      const start = parseISO(a.start_time)
      return start >= lastWeekStart && start < thisWeekStart
    })

    // Calculate metrics
    const thisWeekMetrics = calculateWeeklyMetrics(thisWeekInterruptions, thisWeekActivities)
    const lastWeekMetrics = calculateWeeklyMetrics(lastWeekInterruptions, lastWeekActivities)

    // Biggest increase in interruption minutes
    const thisWeekTotal = thisWeekInterruptions.reduce((sum, i) => sum + (i.duration_minutes || 5), 0)
    const lastWeekTotal = lastWeekInterruptions.reduce((sum, i) => sum + (i.duration_minutes || 5), 0)
    const increase = thisWeekTotal - lastWeekTotal
    const increasePercent = lastWeekTotal > 0 ? Math.round((increase / lastWeekTotal) * 100) : 0

    let biggestIncrease: string | null = null
    if (Math.abs(increase) > 10) { // Only show if significant change
      if (increase > 0) {
        biggestIncrease = `Interruption time increased by ${Math.round(increase)} minutes (${increasePercent}%) this week`
      } else {
        biggestIncrease = `Interruption time decreased by ${Math.abs(Math.round(increase))} minutes (${Math.abs(increasePercent)}%) this week`
      }
    }

    // Top cost driver
    const topDrivers = getTopCostDrivers(thisWeekInterruptions, thisWeekActivities, 1)
    const topCostDriver = topDrivers.length > 0
      ? `${topDrivers[0].type} interruptions caused the highest cost (${topDrivers[0].total_cost.toFixed(1)} total)`
      : null

    // Focus window change
    const thisWeekHourFocus: Record<number, number> = {}
    thisWeekActivities.forEach((a) => {
      if (['Study', 'Coding', 'Work', 'Reading'].includes(a.category)) {
        const start = parseISO(a.start_time)
        const hour = start.getHours()
        const duration = (parseISO(a.end_time).getTime() - start.getTime()) / 1000 / 60
        thisWeekHourFocus[hour] = (thisWeekHourFocus[hour] || 0) + duration
      }
    })

    const lastWeekHourFocus: Record<number, number> = {}
    lastWeekActivities.forEach((a) => {
      if (['Study', 'Coding', 'Work', 'Reading'].includes(a.category)) {
        const start = parseISO(a.start_time)
        const hour = start.getHours()
        const duration = (parseISO(a.end_time).getTime() - start.getTime()) / 1000 / 60
        lastWeekHourFocus[hour] = (lastWeekHourFocus[hour] || 0) + duration
      }
    })

    const thisWeekPeakHour = (Object.entries(thisWeekHourFocus) as [string, number][]).reduce((a, b) =>
      thisWeekHourFocus[parseInt(a[0])] > thisWeekHourFocus[parseInt(b[0])] ? a : b, ['0', 0])[0]
    const lastWeekPeakHour = (Object.entries(lastWeekHourFocus) as [string, number][]).reduce((a, b) =>
      lastWeekHourFocus[parseInt(a[0])] > lastWeekHourFocus[parseInt(b[0])] ? a : b, ['0', 0])[0]

    let focusWindowChange: string | null = null
    if (thisWeekPeakHour !== lastWeekPeakHour && Object.keys(thisWeekHourFocus).length > 0) {
      focusWindowChange = `Your peak focus shifted from ${lastWeekPeakHour.padStart(2, '0')}:00 to ${thisWeekPeakHour.padStart(2, '0')}:00 this week`
    } else if (Object.keys(thisWeekHourFocus).length > 0) {
      focusWindowChange = `Your peak focus remains at ${thisWeekPeakHour.padStart(2, '0')}:00`
    }

    // Generate suggestion
    let suggestion = 'Keep tracking to see more patterns.'
    
    if (increase > 30) {
      suggestion = 'Interruptions increased significantly. Consider blocking time for deep work or identifying the main sources.'
    } else if (increase < -30) {
      suggestion = 'Great progress reducing interruptions! Keep protecting your focus time.'
    } else if (topDrivers.length > 0 && topDrivers[0].total_cost > 50) {
      suggestion = `Focus on reducing ${topDrivers[0].type.toLowerCase()} interruptions - they're your highest cost driver.`
    } else if (thisWeekMetrics.avg_recovery_time && thisWeekMetrics.avg_recovery_time > 30) {
      suggestion = 'Recovery time after interruptions is high. Try shorter breaks to get back to focus faster.'
    } else if (thisWeekTotal < 30 && thisWeekActivities.length > 5) {
      suggestion = 'You\'re maintaining good focus with minimal interruptions. Keep it up!'
    }

    setComparison({
      biggestIncrease,
      topCostDriver,
      focusWindowChange,
      suggestion,
    })
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-neutral-700 rounded w-1/3" />
          <div className="h-20 bg-neutral-700 rounded" />
        </div>
      </div>
    )
  }

  if (!comparison) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What Changed This Week?</h2>
        <p className="text-sm text-neutral-400">
          Track for a full week to see changes and patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">What Changed This Week?</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Key changes and insights from your activity
        </p>
      </div>

      <div className="space-y-4">
        {comparison.biggestIncrease && (
          <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 p-4 border border-blue-500/30">
            {comparison.biggestIncrease.includes('increased') ? (
              <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
            ) : (
              <TrendingDown className="h-5 w-5 text-emerald-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Interruption Change</p>
              <p className="mt-1 text-sm text-neutral-300">{comparison.biggestIncrease}</p>
            </div>
          </div>
        )}

        {comparison.topCostDriver && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-4 border border-amber-500/30">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Top Cost Driver</p>
              <p className="mt-1 text-sm text-neutral-300">{comparison.topCostDriver}</p>
            </div>
          </div>
        )}

        {comparison.focusWindowChange && (
          <div className="flex items-start gap-3 rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
            <TrendingUp className="h-5 w-5 text-purple-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Focus Window</p>
              <p className="mt-1 text-sm text-neutral-300">{comparison.focusWindowChange}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/30">
          <Lightbulb className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Suggestion</p>
            <p className="mt-1 text-sm text-neutral-300">{comparison.suggestion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
