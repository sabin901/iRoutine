'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { format, subDays, startOfDay, parseISO } from 'date-fns'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { calculateAverageFocusQuality, calculateWeeklyMetrics } from '@/lib/interruption-metrics'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function WeeklyInsights() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'focus' | 'interruptions'>('focus')
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadWeeklyData()
  }, [])

  const loadWeeklyData = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        const weekStart = startOfDay(subDays(new Date(), 7))
        
        const weekActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return start >= weekStart
        })
        
        const weekInterruptions = storedInterruptions.filter((i: any) => {
          const time = parseISO(i.time)
          return time >= weekStart
        })
        
        setActivities(weekActivities)
        setInterruptions(weekInterruptions)
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const weekStart = startOfDay(subDays(new Date(), 7))

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .order('start_time', { ascending: true })

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', weekStart.toISOString())
        .order('time', { ascending: true })

      setActivities(activitiesData || [])
      setInterruptions(interruptionsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const { dailyData, qualityMetrics, trends } = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const focusCategories = ['Study', 'Coding', 'Work', 'Reading']

    const dailyData = days.map((day, dayIdx) => {
      const dayDate = subDays(new Date(), 6 - dayIdx)
      const dayStart = startOfDay(dayDate)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayActivities = activities.filter((a) => {
        const start = parseISO(a.start_time)
        return start >= dayStart && start < dayEnd
      })

      const dayInterruptions = interruptions.filter((i) => {
        const time = parseISO(i.time)
        return time >= dayStart && time < dayEnd
      })

      const focusMinutes = dayActivities
        .filter(a => focusCategories.includes(a.category))
        .reduce((total, a) => {
          const start = parseISO(a.start_time)
          const end = parseISO(a.end_time)
          return total + (end.getTime() - start.getTime()) / 1000 / 60
        }, 0)

      const interruptionMinutes = dayInterruptions.reduce((sum, i) => 
        sum + (i.duration_minutes || 5), 0
      )

      return {
        day,
        focusMinutes: Math.round(focusMinutes),
        interruptionMinutes: Math.round(interruptionMinutes),
        interruptionCount: dayInterruptions.length,
        activities: dayActivities.length,
      }
    })

    const qualityMetrics = calculateAverageFocusQuality(activities, interruptions)
    const weeklyMetrics = calculateWeeklyMetrics(interruptions, activities)

    // Calculate trends (comparing first half vs second half of week)
    const firstHalf = dailyData.slice(0, 3).reduce((sum, d) => sum + d.focusMinutes, 0) / 3
    const secondHalf = dailyData.slice(4).reduce((sum, d) => sum + d.focusMinutes, 0) / 3
    const focusTrend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable'
    const focusChange = Math.abs(secondHalf - firstHalf)

    const firstHalfInt = dailyData.slice(0, 3).reduce((sum, d) => sum + d.interruptionMinutes, 0) / 3
    const secondHalfInt = dailyData.slice(4).reduce((sum, d) => sum + d.interruptionMinutes, 0) / 3
    const intTrend = secondHalfInt > firstHalfInt ? 'up' : secondHalfInt < firstHalfInt ? 'down' : 'stable'
    const intChange = Math.abs(secondHalfInt - firstHalfInt)

    return {
      dailyData,
      qualityMetrics,
      trends: {
        focusTrend,
        focusChange: Math.round(focusChange),
        intTrend,
        intChange: Math.round(intChange),
      },
      weeklyMetrics,
    }
  }, [activities, interruptions])

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-neutral-700 rounded-lg w-1/3" />
          <div className="h-64 bg-neutral-700 rounded-xl" />
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6">
        <div className="text-center py-12">
          <p className="text-sm text-neutral-400 font-medium">
            No activities logged this week. Start tracking to see insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 card-hover">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Weekly Trends</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Focus time and interruptions over the past week
            </p>
          </div>
          <div className="flex gap-2 rounded-lg border border-neutral-700/50 p-0.5 bg-neutral-800/50">
            <button
              onClick={() => setViewMode('focus')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                viewMode === 'focus'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setViewMode('interruptions')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                viewMode === 'interruptions'
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              Interruptions
            </button>
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">Focus Trend</div>
                <div className="flex items-center gap-2">
                  {trends.focusTrend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  ) : trends.focusTrend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  ) : (
                    <div className="h-5 w-5 border-t-2 border-neutral-500"></div>
                  )}
                  <span className="text-lg font-bold text-white">
                    {trends.focusTrend === 'up' ? '+' : trends.focusTrend === 'down' ? '-' : '='} {trends.focusChange}m
                  </span>
                </div>
              </div>
            </div>
          </div>

          {interruptions.length > 0 && (
            <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">Interruption Trend</div>
                  <div className="flex items-center gap-2">
                    {trends.intTrend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-red-400" />
                    ) : trends.intTrend === 'down' ? (
                      <TrendingDown className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <div className="h-5 w-5 border-t-2 border-neutral-500"></div>
                    )}
                    <span className="text-lg font-bold text-white">
                      {trends.intTrend === 'up' ? '+' : trends.intTrend === 'down' ? '-' : '='} {trends.intChange}m
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'focus' ? (
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="day" stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} />
              <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} />
              <Tooltip 
                formatter={(value: number) => [`${value} min`, 'Focus Time']}
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="focusMinutes" radius={[8, 8, 0, 0]}>
                {dailyData.map((entry, index) => {
                  const intensity = Math.min(entry.focusMinutes / 480, 1) // 8 hours max
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(97, 114, 243, ${intensity * 0.6 + 0.4})`}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="day" stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} />
              <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3' }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'interruptionMinutes') return [`${value} min`, 'Interruption Time']
                  if (name === 'interruptionCount') return [`${value}`, 'Count']
                  return [value, name]
                }}
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="interruptionMinutes" fill="#ef4444" radius={[8, 8, 0, 0]} opacity={0.9} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between text-sm pt-4 border-t border-neutral-700/50">
        <div className="flex items-center gap-6">
          {viewMode === 'focus' ? (
            <>
              <div>
                <span className="text-neutral-500">Total: </span>
                <span className="font-semibold text-white">
                  {Math.round(dailyData.reduce((sum, d) => sum + d.focusMinutes, 0) / 60 * 10) / 10}h
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Daily Avg: </span>
                <span className="font-semibold text-white">
                  {Math.round((dailyData.reduce((sum, d) => sum + d.focusMinutes, 0) / 7) / 60 * 10) / 10}h
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-neutral-500">Total Time: </span>
                <span className="font-semibold text-white">
                  {Math.round(dailyData.reduce((sum, d) => sum + d.interruptionMinutes, 0))}m
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Total Count: </span>
                <span className="font-semibold text-white">
                  {dailyData.reduce((sum, d) => sum + d.interruptionCount, 0)}
                </span>
              </div>
            </>
          )}
        </div>
        {qualityMetrics.total_sessions > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Avg Quality:</span>
            <span className="font-semibold text-white">
              {qualityMetrics.avg_quality}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
