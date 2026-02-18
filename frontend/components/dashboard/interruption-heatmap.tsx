'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Interruption, Activity } from '@/lib/types'
import { format, subDays, startOfDay, parseISO } from 'date-fns'
import { calculateWeeklyMetrics, calculateInterruptionCost, getTopCostDrivers } from '@/lib/interruption-metrics'
import { AlertCircle, TrendingUp, Clock, Zap, Filter, Eye, Download } from 'lucide-react'

export function InterruptionHeatmap() {
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'minutes' | 'cost' | 'count'>('minutes')
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
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const weekStart = startOfDay(subDays(new Date(), 6))
        
        const weekInterruptions = storedInterruptions.filter((i: any) => {
          const time = parseISO(i.time)
          return time >= weekStart
        })
        
        const weekActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return start >= weekStart
        })
        
        setInterruptions(weekInterruptions)
        setActivities(weekActivities)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const weekStart = startOfDay(subDays(new Date(), 6))

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', weekStart.toISOString())
        .order('time', { ascending: true })

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .order('start_time', { ascending: true })

      setInterruptions(interruptionsData || [])
      setActivities(activitiesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const { heatmapData, maxValue, metrics, topCostDrivers, stats, filteredData } = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const heatmapData: Array<{ 
      day: string
      dayIndex: number
      hour: number
      value: number
      count: number
      types: Record<string, number>
      details: Interruption[]
    }> = []

    days.forEach((day, dayIdx) => {
      hours.forEach((hour) => {
        const dayDate = subDays(new Date(), 6 - dayIdx)
        dayDate.setHours(hour, 0, 0, 0)
        const dayEnd = new Date(dayDate.getTime() + 60 * 60 * 1000)

        const hourInterruptions = interruptions.filter((i) => {
          const time = parseISO(i.time)
          return time >= dayDate && time < dayEnd
        })

        let value = 0
        const types: Record<string, number> = {}

        if (viewMode === 'minutes') {
          value = hourInterruptions.reduce((sum, i) => {
            const duration = i.duration_minutes || 5
            types[i.type] = (types[i.type] || 0) + duration
            return sum + duration
          }, 0)
        } else if (viewMode === 'cost') {
          const matchingActivities = activities.filter((a) => {
            const start = parseISO(a.start_time)
            return start >= dayDate && start < dayEnd
          })
          value = hourInterruptions.reduce((sum, i) => {
            const cost = calculateInterruptionCost(i, matchingActivities)
            const score = cost.cost_score
            types[i.type] = (types[i.type] || 0) + score
            return sum + score
          }, 0)
        } else {
          value = hourInterruptions.length
          hourInterruptions.forEach(i => {
            types[i.type] = (types[i.type] || 0) + 1
          })
        }

        heatmapData.push({
          day,
          dayIndex: dayIdx,
          hour,
          value: Math.round(value),
          count: hourInterruptions.length,
          types,
          details: hourInterruptions,
        })
      })
    })

    const maxValue = Math.max(...heatmapData.map(d => d.value), 1)
    
    // Apply intensity filter
    let filteredData = heatmapData
    if (intensityFilter === 'high') {
      filteredData = heatmapData.map(d => ({
        ...d,
        value: d.value >= maxValue * 0.5 ? d.value : 0,
      }))
    } else if (intensityFilter === 'low') {
      filteredData = heatmapData.map(d => ({
        ...d,
        value: d.value < maxValue * 0.5 && d.value > 0 ? d.value : 0,
      }))
    }

    const weeklyMetrics = calculateWeeklyMetrics(interruptions, activities)
    const topDrivers = getTopCostDrivers(interruptions, activities, 3)

    const totalValue = heatmapData.reduce((sum, d) => sum + d.value, 0)
    const totalCount = heatmapData.reduce((sum, d) => sum + d.count, 0)
    const avgValue = totalCount > 0 ? totalValue / totalCount : 0

    const peakCell = heatmapData.reduce((max, d) => d.value > max.value ? d : max, heatmapData[0])

    const stats = {
      total: viewMode === 'minutes' ? `${totalValue}m` : viewMode === 'cost' ? totalValue.toFixed(0) : totalCount.toString(),
      average: viewMode === 'minutes' ? `${Math.round(avgValue)}m` : viewMode === 'cost' ? avgValue.toFixed(0) : avgValue.toFixed(1),
      peak: `${peakCell.day} ${peakCell.hour}:00`,
      count: totalCount,
    }

    return {
      heatmapData: filteredData,
      maxValue,
      metrics: weeklyMetrics,
      topCostDrivers: topDrivers,
      stats,
      filteredData,
    }
  }, [interruptions, activities, viewMode, intensityFilter])

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
        bg: 'bg-danger-600',
        border: 'border-danger-700',
        text: 'text-white',
        shadow: 'shadow-glow-danger',
      }
    } else if (intensity >= 0.6) {
      return {
        bg: 'bg-danger-500',
        border: 'border-danger-600',
        text: 'text-white',
        shadow: 'shadow-soft-lg',
      }
    } else if (intensity >= 0.4) {
      return {
        bg: 'bg-warning-400',
        border: 'border-warning-500',
        text: 'text-white',
        shadow: 'shadow-soft',
      }
    } else if (intensity >= 0.25) {
      return {
        bg: 'bg-warning-300',
        border: 'border-warning-400',
        text: 'text-neutral-900',
        shadow: '',
      }
    } else if (intensity >= 0.15) {
      return {
        bg: 'bg-yellow-200',
        border: 'border-yellow-300',
        text: 'text-neutral-900',
        shadow: '',
      }
    } else if (intensity >= 0.05) {
      return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-200',
        text: 'text-neutral-700',
        shadow: '',
      }
    } else {
      return {
        bg: 'bg-danger-50',
        border: 'border-danger-100',
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

  if (interruptions.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft-lg">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 font-medium">No interruptions logged yet</p>
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-danger-500 to-warning-600 shadow-glow-danger">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Interruption Heatmap</h2>
              <p className="text-xs text-neutral-400">7-day pattern analysis</p>
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
                onClick={() => setViewMode('cost')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'cost'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <Zap className="h-3 w-3 inline mr-1" />
                Cost
              </button>
              <button
                onClick={() => setViewMode('count')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'count'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                #
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
          <div className="relative overflow-hidden bg-gradient-to-br from-danger-50 to-warning-50 rounded-xl p-4 border border-danger-100/50">
            <div className="text-2xs font-semibold text-danger-600 mb-1.5 uppercase tracking-wide">Total {viewMode === 'minutes' ? 'Time' : viewMode === 'cost' ? 'Cost' : 'Count'}</div>
            <div className="text-2xl font-bold text-danger-900">{stats.total}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-danger-500/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-warning-50 to-yellow-50 rounded-xl p-4 border border-warning-100/50">
            <div className="text-2xs font-semibold text-warning-700 mb-1.5 uppercase tracking-wide">Average</div>
            <div className="text-2xl font-bold text-warning-900">{stats.average}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-warning-500/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100/50">
            <div className="text-2xs font-semibold text-yellow-700 mb-1.5 uppercase tracking-wide">Peak Time</div>
            <div className="text-base font-bold text-yellow-900">{stats.peak}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-yellow-500/5 rounded-full"></div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4 border border-neutral-200/50">
            <div className="text-2xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">Count</div>
            <div className="text-2xl font-bold text-neutral-900">{stats.count}</div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-neutral-500/5 rounded-full"></div>
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
                        isHovered || isSelected ? 'ring-2 ring-danger-400 ring-offset-1 scale-105' : ''
                      }`}
                    >
                      {cell.value > 0 && cell.value}
                    </div>

                    {/* Detailed Tooltip */}
                    {isHovered && cell.value > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-scale-in">
                        <div className="bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs whitespace-nowrap backdrop-blur-sm">
                          <div className="font-semibold mb-1.5 text-neutral-100">{day}, {hour}:00</div>
                          <div className="text-warning-300 font-bold mb-1.5 text-sm">
                            {viewMode === 'minutes' ? `${cell.value} minutes` : 
                             viewMode === 'cost' ? `Cost: ${cell.value}` :
                             `${cell.value} interruptions`}
                          </div>
                          {cell.count > 0 && (
                            <>
                              <div className="text-neutral-400 text-2xs mb-2 font-medium">{cell.count} interruption{cell.count > 1 ? 's' : ''}</div>
                              {Object.entries(cell.types).length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-neutral-700/50">
                                  {Object.entries(cell.types).map(([type, value]) => (
                                    <div key={type} className="flex items-center justify-between gap-4 text-2xs mb-1">
                                      <span className="text-neutral-400">{type}:</span>
                                      <span className="text-white font-semibold">
                                        {viewMode === 'minutes' ? `${value}m` : 
                                         viewMode === 'cost' ? value :
                                         value}
                                      </span>
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
              { label: 'Low', bg: 'bg-danger-50', border: 'border-danger-100' },
              { label: '', bg: 'bg-yellow-100', border: 'border-yellow-200' },
              { label: '', bg: 'bg-yellow-200', border: 'border-yellow-300' },
              { label: '', bg: 'bg-warning-300', border: 'border-warning-400' },
              { label: '', bg: 'bg-warning-400', border: 'border-warning-500' },
              { label: '', bg: 'bg-danger-500', border: 'border-danger-600' },
              { label: 'High', bg: 'bg-danger-600', border: 'border-danger-700' },
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

      {/* Top Cost Drivers */}
      {topCostDrivers.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-danger-600" />
            Top Cost Drivers
          </div>
          {topCostDrivers.map((driver, idx) => (
            <div
              key={driver.type}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-danger-50 to-warning-50 border border-danger-100/50 hover:shadow-soft-lg hover:border-danger-200 transition-all animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-danger-500 to-warning-600 text-white font-bold text-xs shadow-soft">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm text-neutral-900 mb-0.5">{driver.type}</div>
                  <div className="text-xs text-neutral-600 font-medium">
                    {driver.count} interruption{driver.count > 1 ? 's' : ''} • {driver.total_cost} cost
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-danger-700">{Math.round(driver.avg_cost)}</div>
                <div className="text-2xs text-danger-600 font-semibold uppercase tracking-wide">avg cost</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
