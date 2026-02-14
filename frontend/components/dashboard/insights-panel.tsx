'use client'

import { useEffect, useState, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import type { Insight, Interruption, Activity } from '@/lib/types'
import { calculateDailyMetrics, calculateWeeklyMetrics, getTopCostDrivers, calculateAverageFocusQuality } from '@/lib/interruption-metrics'
import { Clock, AlertTriangle, TrendingUp, Star, Target, Zap, BarChart3 } from 'lucide-react'

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight | null>(null)
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        
        setActivities(storedActivities)
        setInterruptions(storedInterruptions)
        
        if (storedActivities.length === 0) {
          setInsights(null)
          setLoading(false)
          return
        }
        
        // Calculate peak focus window
        const hourFocus: Record<number, number> = {}
        storedActivities.forEach((a: any) => {
          if (['Study', 'Coding', 'Work', 'Reading'].includes(a.category)) {
            const start = new Date(a.start_time)
            const hour = start.getHours()
            const duration = (new Date(a.end_time).getTime() - start.getTime()) / 1000 / 60
            hourFocus[hour] = (hourFocus[hour] || 0) + duration
          }
        })
        
        const peakHour = (Object.entries(hourFocus) as [string, number][]).reduce((a, b) =>
          hourFocus[parseInt(a[0])] > hourFocus[parseInt(b[0])] ? a : b, ['0', 0])[0]
        const nextHour = (parseInt(peakHour) + 1) % 24
        const peakWindow = `Your focus is strongest between ${peakHour.padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`
        
        // Calculate distraction hotspot
        const hourInterruptions: Record<number, number> = {}
        storedInterruptions.forEach((i: any) => {
          const time = new Date(i.time)
          const hour = time.getHours()
          hourInterruptions[hour] = (hourInterruptions[hour] || 0) + 1
        })
        
        const hotspotHour = (Object.entries(hourInterruptions) as [string, number][]).reduce((a, b) =>
          hourInterruptions[parseInt(a[0])] > hourInterruptions[parseInt(b[0])] ? a : b, ['0', 0])[0]
        const distractionHotspot = hourInterruptions[parseInt(hotspotHour)] 
          ? `Most interruptions around ${hotspotHour.padStart(2, '0')}:00`
          : 'No interruptions logged'
        
        // Calculate balance
        const focusActivities = storedActivities.filter((a: any) => 
          ['Study', 'Coding', 'Work', 'Reading'].includes(a.category)
        )
        const restActivities = storedActivities.filter((a: any) => a.category === 'Rest')
        
        const totalFocus = focusActivities.reduce((sum: number, a: any) => {
          return sum + (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 1000 / 60
        }, 0)
        const totalRest = restActivities.reduce((sum: number, a: any) => {
          return sum + (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 1000 / 60
        }, 0)
        const balanceRatio = totalFocus / (totalFocus + totalRest) || 0.5
        
        const consistencyScore = storedActivities.length > 3 ? 0.7 : 0.5
        
        const dailyMetrics = calculateDailyMetrics(storedInterruptions, storedActivities)
        const weeklyMetrics = calculateWeeklyMetrics(storedInterruptions, storedActivities)
        const topCostDrivers = getTopCostDrivers(storedInterruptions, storedActivities, 1)
        const qualityMetrics = calculateAverageFocusQuality(storedActivities, storedInterruptions)
        
        let suggestion = balanceRatio > 0.8 
          ? 'Consider adding more rest time to your schedule.'
          : balanceRatio < 0.3
          ? 'You might benefit from more focused work blocks.'
          : 'Keep tracking to discover more patterns.'
        
        if (topCostDrivers.length > 0 && topCostDrivers[0].total_cost > 30) {
          suggestion = `${topCostDrivers[0].type} interruptions are your highest cost. Consider reducing them.`
        } else if (weeklyMetrics.avg_recovery_time && weeklyMetrics.avg_recovery_time > 20) {
          suggestion = `It takes ${Math.round(weeklyMetrics.avg_recovery_time)} minutes on average to resume focus after interruptions.`
        } else if (qualityMetrics.avg_quality < 70 && qualityMetrics.total_sessions > 0) {
          suggestion = `Your focus quality is ${qualityMetrics.avg_quality}%. Try longer, uninterrupted sessions.`
        }
        
        setInsights({
          peak_focus_window: peakWindow,
          distraction_hotspot: distractionHotspot,
          consistency_score: consistencyScore,
          balance_ratio: balanceRatio,
          suggestion,
        })
        setLoading(false)
        return
      }

      const data = await apiRequest<Insight>('/api/insights')
      setInsights(data)
    } catch (err) {
      console.error('Error loading insights:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate all metrics
  const metrics = useMemo(() => {
    if (activities.length === 0 && interruptions.length === 0) return null
    
    const dailyMetrics = calculateDailyMetrics(interruptions, activities)
    const weeklyMetrics = calculateWeeklyMetrics(interruptions, activities)
    const topCostDrivers = getTopCostDrivers(interruptions, activities, 3)
    const qualityMetrics = calculateAverageFocusQuality(activities, interruptions)
    
    // Calculate focus stats
    const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
    const focusActivities = activities.filter(a => focusCategories.includes(a.category))
    const totalFocusMinutes = focusActivities.reduce((sum, a) => {
      const start = new Date(a.start_time)
      const end = new Date(a.end_time)
      return sum + (end.getTime() - start.getTime()) / 1000 / 60
    }, 0)
    
    // Calculate daily averages
    const daysWithData = new Set(activities.map(a => {
      const date = new Date(a.start_time)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    })).size
    
    const avgDailyFocus = daysWithData > 0 ? totalFocusMinutes / daysWithData : 0
    
    return {
      dailyMetrics,
      weeklyMetrics,
      topCostDrivers,
      qualityMetrics,
      totalFocusMinutes,
      avgDailyFocus,
      focusActivities: focusActivities.length,
    }
  }, [activities, interruptions])

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-neutral-700 rounded w-1/2" />
          <div className="h-20 bg-neutral-700 rounded" />
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6">
        <div className="text-center py-8">
          <BarChart3 className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">
            Not enough data yet. Log a few days of activities to see insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Your Patterns</h2>
        <p className="mt-1 text-sm text-neutral-400">Insights from your activity data</p>
      </div>

      {/* Key Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-neutral-400">Focus Time</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {Math.round(metrics.totalFocusMinutes / 60 * 10) / 10}h
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {Math.round(metrics.avgDailyFocus / 60 * 10) / 10}h/day avg
            </div>
          </div>

          <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-neutral-400">Quality</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {metrics.qualityMetrics.avg_quality}%
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {metrics.qualityMetrics.high_quality_sessions}/{metrics.qualityMetrics.total_sessions} high quality
            </div>
          </div>

          {interruptions.length > 0 && (
            <>
              <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-xs font-medium text-neutral-400">Interruptions</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {interruptions.length}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {metrics.dailyMetrics.total_interruptions_minutes ? Math.round(metrics.dailyMetrics.total_interruptions_minutes) : 0} min today
                </div>
              </div>

              <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-neutral-400">Recovery</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {metrics.weeklyMetrics.avg_recovery_time ? Math.round(metrics.weeklyMetrics.avg_recovery_time) : 0}m
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  avg recovery time
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Core Insights */}
      <div className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Peak Focus</h3>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">{insights.peak_focus_window}</p>
        </div>

        {interruptions.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-900">Distractions</h3>
            </div>
            <p className="text-sm text-red-800 leading-relaxed">{insights.distraction_hotspot}</p>
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Consistency</h3>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(insights.consistency_score * 100)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-400 to-gray-600 transition-all duration-500"
              style={{ width: `${insights.consistency_score * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            How consistent your schedule is across days
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Balance</h3>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Focus</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(insights.balance_ratio * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                  style={{ width: `${insights.balance_ratio * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">Rest</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round((1 - insights.balance_ratio) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${(1 - insights.balance_ratio) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cost Drivers */}
      {metrics && metrics.topCostDrivers.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Cost Drivers</h3>
          <div className="space-y-2">
            {metrics.topCostDrivers.map((driver, idx) => (
              <div key={driver.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    idx === 0 ? 'text-red-600' :
                    idx === 1 ? 'text-orange-600' :
                    'text-yellow-600'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-gray-900">{driver.type}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{driver.total_cost.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{driver.count} interruptions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Suggestion</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
          {insights.suggestion}
        </p>
      </div>
    </div>
  )
}
