'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { parseISO, subDays, startOfDay } from 'date-fns'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart, Legend } from 'recharts'
import { TrendingUp, Zap } from 'lucide-react'
import { calculateProductivityCurve } from '@/lib/advanced-insights'

export function ProductivityCurve() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [loading, setLoading] = useState(true)
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

      const { data: { user } } = await supabase.auth.getUser()
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-100 rounded-lg w-1/3"></div>
          <div className="h-64 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="text-center py-12">
          <TrendingUp className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium">
            No data yet. Start tracking to see your productivity curve.
          </p>
        </div>
      </div>
    )
  }

  const curveData = calculateProductivityCurve(activities, interruptions)
  const peakHour = curveData.reduce((max, curr) => curr.focusMinutes > max.focusMinutes ? curr : max, curveData[0])
  const avgQuality = Math.round(curveData.reduce((sum, h) => sum + h.quality, 0) / curveData.length)

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg card-hover">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Productivity Curve</h2>
            <p className="text-xs text-neutral-500">Your focus and quality patterns throughout the day</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-4 border border-primary-100/50">
          <div className="text-2xs font-semibold text-primary-600 mb-1.5 uppercase tracking-wide">Peak Hour</div>
          <div className="text-xl font-bold text-primary-900">{peakHour.label}</div>
          <div className="text-xs text-primary-700 font-medium">{peakHour.focusMinutes}m of focus</div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary-500/5 rounded-full"></div>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-success-50 to-success-100/50 rounded-xl p-4 border border-success-100/50">
          <div className="text-2xs font-semibold text-success-600 mb-1.5 uppercase tracking-wide">Avg Quality</div>
          <div className="text-xl font-bold text-success-900">{avgQuality}%</div>
          <div className="text-xs text-success-700 font-medium">Across all hours</div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-success-500/5 rounded-full"></div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={curveData}>
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              interval={2}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'focusMinutes') return [`${value} min`, 'Focus Time']
                if (name === 'quality') return [`${value}%`, 'Quality']
                if (name === 'interruptions') return [`${value}`, 'Interruptions']
                return [value, name]
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value: string) => {
                if (value === 'focusMinutes') return 'Focus Time (min)'
                if (value === 'quality') return 'Quality Score'
                return value
              }}
            />
            <Area 
              type="monotone" 
              dataKey="focusMinutes" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#focusGradient)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="quality" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 p-4 border border-primary-200/50">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white shadow-soft">
            <Zap className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-primary-900 mb-1.5">Insight</div>
            <div className="text-xs text-primary-700 leading-relaxed">
              Your productivity peaks at <span className="font-semibold">{peakHour.label}</span> with <span className="font-semibold">{peakHour.focusMinutes}</span> minutes of focused work. 
              {peakHour.interruptions === 0 
                ? ' This time has zero interruptions - ideal for deep work!'
                : ` Try minimizing interruptions during this golden hour.`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
