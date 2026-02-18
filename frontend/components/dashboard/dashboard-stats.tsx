'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { startOfDay, parseISO, isToday } from 'date-fns'
import { StatsCard } from './stats-card'
import { Target, Zap, Clock, TrendingUp } from 'lucide-react'
import { calculateAverageFocusQuality } from '@/lib/interruption-metrics'

export function DashboardStats() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTodayData()
  }, [])

  const loadTodayData = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        
        const today = startOfDay(new Date())
        const todayActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return isToday(start)
        })
        
        const todayInterruptions = storedInterruptions.filter((i: any) => {
          const time = parseISO(i.time)
          return isToday(time)
        })
        
        setActivities(todayActivities)
        setInterruptions(todayInterruptions)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = startOfDay(new Date())

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', today.toISOString())
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 sm:p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-4" />
            <div className="h-8 bg-slate-100 rounded-lg w-1/3 mt-3" />
          </div>
        ))}
      </div>
    )
  }

  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
  const focusActivities = activities.filter(a => focusCategories.includes(a.category))
  
  const totalFocusMinutes = focusActivities.reduce((sum, a) => {
    const start = parseISO(a.start_time)
    const end = parseISO(a.end_time)
    return sum + (end.getTime() - start.getTime()) / 1000 / 60
  }, 0)

  const totalInterruptionMinutes = interruptions.reduce((sum, i) => 
    sum + (i.duration_minutes || 5), 0
  )

  const qualityMetrics = calculateAverageFocusQuality(activities, interruptions)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Focus Time"
        value={`${Math.round(totalFocusMinutes / 60 * 10) / 10}h`}
        subtitle="Today"
        icon={Target}
        gradient="blue"
      />
      <StatsCard
        title="Activities"
        value={activities.length.toString()}
        subtitle="Logged today"
        icon={Zap}
        gradient="purple"
      />
      <StatsCard
        title="Interruptions"
        value={interruptions.length.toString()}
        subtitle={`${Math.round(totalInterruptionMinutes)}m total`}
        icon={Clock}
        gradient="orange"
      />
      <StatsCard
        title="Quality"
        value={`${qualityMetrics.avg_quality}%`}
        subtitle={`${qualityMetrics.high_quality_sessions} high quality`}
        icon={TrendingUp}
        gradient="green"
      />
    </div>
  )
}
