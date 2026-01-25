'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption, PlannedActivity } from '@/lib/types'
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, differenceInMinutes } from 'date-fns'
import { Clock, AlertCircle, Target, CheckCircle2 } from 'lucide-react'

const categoryColors: Record<string, string> = {
  Study: 'border-l-primary-500 bg-primary-50',
  Coding: 'border-l-primary-600 bg-primary-50',
  Work: 'border-l-success-500 bg-success-50',
  Reading: 'border-l-warning-500 bg-warning-50',
  Rest: 'border-l-neutral-400 bg-neutral-50',
  Social: 'border-l-primary-400 bg-primary-50',
  Other: 'border-l-neutral-400 bg-neutral-50',
}

export function TodayTimeline() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [interruptions, setInterruptions] = useState<Interruption[]>([])
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>([])
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
        const storedPlans = JSON.parse(localStorage.getItem('routine_daily_plans') || '[]')
        
        const todayStart = startOfDay(new Date())
        const todayEnd = endOfDay(new Date())
        
        const todayActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return start >= todayStart && start <= todayEnd
        })
        
        const todayInterruptions = storedInterruptions.filter((i: any) => {
          const time = parseISO(i.time)
          return time >= todayStart && time <= todayEnd
        })

        const todayPlan = storedPlans.find((p: any) => p.date === format(new Date(), 'yyyy-MM-dd'))
        setPlannedActivities(todayPlan?.planned_activities || [])
        
        setActivities(todayActivities)
        setInterruptions(todayInterruptions)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const todayStart = startOfDay(new Date())
      const todayEnd = endOfDay(new Date())

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', todayStart.toISOString())
        .lte('start_time', todayEnd.toISOString())
        .order('start_time', { ascending: true })

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', todayStart.toISOString())
        .lte('time', todayEnd.toISOString())
        .order('time', { ascending: true })

      setActivities(activitiesData || [])
      setInterruptions(interruptionsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Merge and sort all events
  const allEvents = useMemo(() => {
    const events: Array<{
      type: 'activity' | 'interruption' | 'planned'
      data: Activity | Interruption | PlannedActivity
      time: Date
    }> = []

    activities.forEach(a => {
      events.push({
        type: 'activity',
        data: a,
        time: parseISO(a.start_time),
      })
    })

    interruptions.forEach(i => {
      events.push({
        type: 'interruption',
        data: i,
        time: parseISO(i.time),
      })
    })

    plannedActivities.forEach(p => {
      events.push({
        type: 'planned',
        data: p,
        time: parseISO(p.planned_start),
      })
    })

    return events.sort((a, b) => a.time.getTime() - b.time.getTime())
  }, [activities, interruptions, plannedActivities])

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-100 rounded-lg w-1/3"></div>
          <div className="h-32 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (allEvents.length === 0 && plannedActivities.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="text-center py-16">
          <Clock className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">No Activities Today</h2>
          <p className="text-sm text-neutral-500 font-medium mb-6">
            Start by logging an activity or setting up your daily plan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg card-hover">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-primary">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Today&apos;s Timeline</h2>
            <p className="text-xs text-neutral-500">Your activities and interruptions throughout the day</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allEvents.map((event, idx) => {
          if (event.type === 'activity') {
            const activity = event.data as Activity
            const start = parseISO(activity.start_time)
            const end = parseISO(activity.end_time)
            const duration = differenceInMinutes(end, start)
            const categoryColor = categoryColors[activity.category] || categoryColors.Other

            return (
              <div
                key={activity.id}
                className={`rounded-xl border-l-4 ${categoryColor} p-4 border border-l-4 transition-all hover:shadow-soft-lg animate-slide-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-neutral-900">{activity.category}</span>
                      <span className="text-xs text-neutral-500 font-medium">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                      </span>
                    </div>
                    {activity.note && (
                      <p className="text-sm text-neutral-600 mt-1">{activity.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-900">
                      {Math.floor(duration / 60) > 0 && `${Math.floor(duration / 60)}h `}
                      {duration % 60}m
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          if (event.type === 'interruption') {
            const interruption = event.data as Interruption
            const time = parseISO(interruption.time)
            const duration = interruption.duration_minutes || 5

            return (
              <div
                key={interruption.id}
                className="rounded-xl border-l-4 border-danger-500 bg-danger-50 p-4 border transition-all hover:shadow-soft-lg animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-danger-600" />
                      <span className="text-sm font-semibold text-danger-900">{interruption.type}</span>
                      <span className="text-xs text-danger-600 font-medium">
                        {format(time, 'h:mm a')}
                        {interruption.end_time && ` - ${format(parseISO(interruption.end_time), 'h:mm a')}`}
                      </span>
                    </div>
                    {interruption.note && (
                      <p className="text-sm text-danger-700 mt-1">{interruption.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-danger-900">
                      {Math.floor(duration / 60) > 0 && `${Math.floor(duration / 60)}h `}
                      {duration % 60}m
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          if (event.type === 'planned') {
            const planned = event.data as PlannedActivity
            const start = parseISO(planned.planned_start)
            const end = parseISO(planned.planned_end)
            const isCompleted = activities.some(a => 
              a.category === planned.category &&
              Math.abs(parseISO(a.start_time).getTime() - start.getTime()) < 30 * 60 * 1000
            )

            return (
              <div
                key={planned.id}
                className={`rounded-xl border-l-4 border-gray-300 bg-gray-50 p-4 transition-all ${
                  isCompleted ? 'opacity-60' : ''
                } animate-slide-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Target className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                        {planned.description}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        {planned.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        planned.priority === 'high' ? 'bg-red-100 text-red-700' :
                        planned.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {planned.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Summary */}
      {activities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200/60">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-900">{activities.length}</div>
              <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Activities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700">
                {Math.round(activities.reduce((sum, a) => {
                  const start = parseISO(a.start_time)
                  const end = parseISO(a.end_time)
                  return sum + differenceInMinutes(end, start)
                }, 0) / 60 * 10) / 10}h
              </div>
              <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Total Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-danger-600">{interruptions.length}</div>
              <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">Interruptions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
