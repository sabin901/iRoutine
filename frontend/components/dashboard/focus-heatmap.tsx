'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity } from '@/lib/types'
import { subDays, startOfDay, parseISO } from 'date-fns'
import { Target, Clock, Zap, Eye, TrendingUp, Filter } from 'lucide-react'

export function FocusHeatmap() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'minutes' | 'sessions' | 'quality'>('minutes')
  const [intensityFilter, setIntensityFilter] = useState<'all' | 'high' | 'low'>('all')
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number } | null>(null)
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
        const weekStart = startOfDay(subDays(new Date(), 6))
        
        const weekActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return start >= weekStart
        })
        
        setActivities(weekActivities)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const weekStart = startOfDay(subDays(new Date(), 6))

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .order('start_time', { ascending: true })

      setActivities(activitiesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const { heatmapData, maxValue, stats, filteredData } = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const focusCategories = ['Study', 'Coding', 'Work', 'Reading']

    const heatmapData: Array<{ 
      day: string
      dayIndex: number
      hour: number
      minutes: number
      sessions: number
      categories: Record<string, number>
      details: Activity[]
      quality: number
    }> = []

    days.forEach((day, dayIdx) => {
      hours.forEach((hour) => {
        const dayDate = subDays(new Date(), 6 - dayIdx)
        dayDate.setHours(hour, 0, 0, 0)
        const dayEnd = new Date(dayDate.getTime() + 60 * 60 * 1000)

        const hourActivities = activities.filter((a) => {
          if (!focusCategories.includes(a.category)) return false
          const start = parseISO(a.start_time)
          const end = parseISO(a.end_time)
          return start < dayEnd && end > dayDate
        })

        let minutes = 0
        const categories: Record<string, number> = {}
        
        hourActivities.forEach((a) => {
          const start = parseISO(a.start_time)
          const end = parseISO(a.end_time)
          const overlapStart = start > dayDate ? start : dayDate
          const overlapEnd = end < dayEnd ? end : dayEnd
          const duration = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / 1000 / 60)
          minutes += duration
          categories[a.category] = (categories[a.category] || 0) + duration
        })

        // Calculate quality score (higher minutes and fewer sessions = better quality)
        const quality = hourActivities.length > 0 
          ? Math.min(100, (minutes / hourActivities.length) * 2)
          : 0

        heatmapData.push({
          day,
          dayIndex: dayIdx,
          hour,
          minutes: Math.round(minutes),
          sessions: hourActivities.length,
          categories,
          details: hourActivities,
          quality: Math.round(quality),
        })
      })
    })

    let displayData = heatmapData
    let maxValue = 1

    if (viewMode === 'minutes') {
      maxValue = Math.max(...heatmapData.map(d => d.minutes), 1)
      displayData = heatmapData.map(d => ({ ...d, value: d.minutes }))
    } else if (viewMode === 'sessions') {
      maxValue = Math.max(...heatmapData.map(d => d.sessions), 1)
      displayData = heatmapData.map(d => ({ ...d, value: d.sessions }))
    } else {
      maxValue = 100
      displayData = heatmapData.map(d => ({ ...d, value: d.quality }))
    }

    // Apply intensity filter
    type RowWithValue = typeof heatmapData[number] & { value: number }
    const dataWithValue = displayData as RowWithValue[]
    let filteredData: RowWithValue[] = dataWithValue
    if (intensityFilter === 'high') {
      filteredData = dataWithValue.map(d => ({
        ...d,
        value: d.value >= maxValue * 0.5 ? d.value : 0,
      }))
    } else if (intensityFilter === 'low') {
      filteredData = dataWithValue.map(d => ({
        ...d,
        value: d.value < maxValue * 0.5 && d.value > 0 ? d.value : 0,
      }))
    }

    const totalFocusMinutes = heatmapData.reduce((sum, d) => sum + d.minutes, 0)
    const totalSessions = heatmapData.reduce((sum, d) => sum + d.sessions, 0)
    const avgQuality = totalSessions > 0
      ? Math.round(heatmapData.filter(d => d.sessions > 0).reduce((sum, d) => sum + d.quality, 0) / 
          heatmapData.filter(d => d.sessions > 0).length)
      : 0

    const peakCell = heatmapData.reduce((max, d) => d.minutes > max.minutes ? d : max, heatmapData[0])

    const stats = {
      totalHours: (totalFocusMinutes / 60).toFixed(1),
      totalSessions,
      avgQuality: `${avgQuality}%`,
      peak: `${peakCell.day} ${peakCell.hour}:00`,
    }

    return {
      heatmapData: filteredData,
      maxValue,
      stats,
      filteredData,
    }
  }, [activities, viewMode, intensityFilter])

  const getColorIntensity = (value: number) => {
    if (value === 0) return {
      bg: 'bg-neutral-50',
      border: 'border-neutral-100',
      text: 'text-neutral-400',
      shadow: '',
    }

    const intensity = value / maxValue

    if (intensity >= 0.8) {
      return {
        bg: 'bg-primary-600',
        border: 'border-primary-700',
        text: 'text-white',
        shadow: 'shadow-glow-primary',
      }
    } else if (intensity >= 0.6) {
      return {
        bg: 'bg-primary-500',
        border: 'border-primary-600',
        text: 'text-white',
        shadow: 'shadow-soft-lg',
      }
    } else if (intensity >= 0.4) {
      return {
        bg: 'bg-primary-400',
        border: 'border-primary-500',
        text: 'text-white',
        shadow: 'shadow-soft',
      }
    } else if (intensity >= 0.25) {
      return {
        bg: 'bg-primary-300',
        border: 'border-primary-400',
        text: 'text-neutral-900',
        shadow: '',
      }
    } else if (intensity >= 0.15) {
      return {
        bg: 'bg-primary-200',
        border: 'border-primary-300',
        text: 'text-neutral-900',
        shadow: '',
      }
    } else if (intensity >= 0.05) {
      return {
        bg: 'bg-primary-100',
        border: 'border-primary-200',
        text: 'text-neutral-700',
        shadow: '',
      }
    } else {
      return {
        bg: 'bg-primary-50',
        border: 'border-primary-100',
        text: 'text-neutral-600',
        shadow: '',
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-700 rounded-lg w-1/3"></div>
          <div className="h-96 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft-lg">
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 font-medium">No focus activities logged yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft-lg card-hover">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Focus Time Heatmap</h2>
              <p className="text-xs text-neutral-400">7-day focus analysis</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-neutral-700/50 p-0.5 bg-neutral-800/50">
              <button
                onClick={() => setViewMode('minutes')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'minutes'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Clock className="h-3 w-3 inline mr-1" />
                Time
              </button>
              <button
                onClick={() => setViewMode('sessions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'sessions'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Zap className="h-3 w-3 inline mr-1" />
                Sessions
              </button>
              <button
                onClick={() => setViewMode('quality')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'quality'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Eye className="h-3 w-3 inline mr-1" />
                Quality
              </button>
            </div>

            <div className="flex rounded-lg border border-neutral-700/50 p-0.5 bg-neutral-800/50">
              <button
                onClick={() => setIntensityFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  intensityFilter === 'all'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setIntensityFilter('high')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  intensityFilter === 'high'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Filter className="h-3 w-3 inline mr-1" />
                High
              </button>
              <button
                onClick={() => setIntensityFilter('low')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  intensityFilter === 'low'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                Low
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4 border border-primary-100/50">
            <div className="text-2xs font-semibold text-primary-600 mb-1.5 uppercase tracking-wide">Total Hours</div>
            <div className="text-2xl font-bold text-primary-900">{stats.totalHours}h</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-500/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4 border border-primary-200/50">
            <div className="text-2xs font-semibold text-primary-700 mb-1.5 uppercase tracking-wide">Sessions</div>
            <div className="text-2xl font-bold text-primary-900">{stats.totalSessions}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-600/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-success-50 to-success-100/50 rounded-xl p-4 border border-success-100/50">
            <div className="text-2xs font-semibold text-success-700 mb-1.5 uppercase tracking-wide">Avg Quality</div>
            <div className="text-2xl font-bold text-success-900">{stats.avgQuality}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-success-500/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-warning-50 to-warning-100/50 rounded-xl p-4 border border-warning-100/50">
            <div className="text-2xs font-semibold text-warning-700 mb-1.5 uppercase tracking-wide">Peak Time</div>
            <div className="text-base font-bold text-warning-900">{stats.peak}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-warning-500/5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-2">
            <div className="w-12"></div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="flex-1 text-center">
                <div className="text-xs font-semibold text-neutral-700 tracking-wide">{day}</div>
              </div>
            ))}
          </div>

          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="flex gap-1 mb-1">
              <div className="w-12 flex items-center justify-end pr-2">
                <div className="text-2xs font-semibold text-neutral-400 tracking-tight">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              </div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => {
                const cell = heatmapData.find((d) => d.day === day && d.hour === hour)
                if (!cell) return null

                const colors = getColorIntensity(cell.value)
                const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour
                const isSelected = selectedCell?.day === day && selectedCell?.hour === hour

                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 relative group cursor-pointer transition-all duration-200 ${
                      isHovered || isSelected ? 'scale-110 z-10' : 'scale-100'
                    }`}
                    onMouseEnter={() => setHoveredCell({ day, hour })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => setSelectedCell(isSelected ? null : { day, hour })}
                  >
                    <div
                      className={`aspect-square rounded-lg ${colors.bg} border ${colors.border} ${colors.shadow} flex items-center justify-center ${colors.text} font-semibold text-2xs transition-all duration-200 ${
                        isHovered || isSelected ? 'ring-2 ring-primary-400 ring-offset-1 scale-105' : ''
                      }`}
                    >
                      {cell.value > 0 && (viewMode === 'quality' ? `${cell.value}%` : cell.value)}
                    </div>

                    {/* Detailed Tooltip */}
                    {isHovered && cell.value > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-scale-in">
                        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs whitespace-nowrap backdrop-blur-sm">
                          <div className="font-semibold mb-1.5 text-neutral-100">{day}, {hour}:00</div>
                          <div className="text-primary-300 font-bold mb-1.5 text-sm">
                            {cell.minutes} minutes
                          </div>
                          {cell.sessions > 0 && (
                            <>
                              <div className="text-neutral-400 text-2xs mb-2 font-medium">
                                {cell.sessions} session{cell.sessions > 1 ? 's' : ''} • {cell.quality}% quality
                              </div>
                              {Object.keys(cell.categories).length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-neutral-700/50">
                                  {Object.entries(cell.categories).map(([category, minutes]) => (
                                    <div key={category} className="flex items-center justify-between gap-4 text-2xs mb-1">
                                      <span className="text-neutral-400">{category}:</span>
                                      <span className="text-white font-semibold">{Math.round(minutes)}m</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="w-2 h-2 bg-neutral-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-700/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Intensity:</span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'None', bg: 'bg-neutral-50', border: 'border-neutral-200' },
              { label: 'Low', bg: 'bg-primary-50', border: 'border-primary-100' },
              { label: '', bg: 'bg-primary-100', border: 'border-primary-200' },
              { label: '', bg: 'bg-primary-200', border: 'border-primary-300' },
              { label: '', bg: 'bg-primary-300', border: 'border-primary-400' },
              { label: '', bg: 'bg-primary-400', border: 'border-primary-500' },
              { label: '', bg: 'bg-primary-500', border: 'border-primary-600' },
              { label: 'High', bg: 'bg-primary-600', border: 'border-primary-700' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} shadow-sm`}></div>
                {item.label && <span className="text-2xs text-neutral-400 mt-1 font-medium">{item.label}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-neutral-400 font-medium">
          Click any cell for details
        </div>
      </div>

      {/* Insight */}
      <div className="rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 p-4 border border-primary-200/50">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white shadow-soft">
            <TrendingUp className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-primary-900 mb-1.5">Focus Pattern</div>
            <div className="text-xs text-primary-700 leading-relaxed">
              You&apos;ve logged <span className="font-semibold">{stats.totalHours}h</span> of focus time across <span className="font-semibold">{stats.totalSessions}</span> sessions this week.
              Your peak productivity is at <span className="font-semibold">{stats.peak}</span> with an average quality score of <span className="font-semibold">{stats.avgQuality}</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
