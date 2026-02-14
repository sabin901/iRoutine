'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption, PlannedActivity } from '@/lib/types'
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, differenceInMinutes } from 'date-fns'
import { Clock, AlertCircle, Target, CheckCircle2 } from 'lucide-react'

const categoryColors: Record<string, string> = {
  Study: 'border-l-blue-500 bg-blue-50',
  Coding: 'border-l-violet-500 bg-violet-50',
  Work: 'border-l-emerald-500 bg-emerald-50',
  Reading: 'border-l-amber-500 bg-amber-50',
  Rest: 'border-l-slate-400 bg-slate-100',
  Social: 'border-l-pink-500 bg-pink-50',
  Other: 'border-l-slate-400 bg-slate-100',
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
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (allEvents.length === 0 && plannedActivities.length === 0) {
    return (
      <div className="card p-8 sm:p-10">
        <div className="text-center py-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
            <Clock className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No activities yet</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Log an activity or add items to your daily plan to see your timeline here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-hover p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
          <Clock className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Timeline</h2>
          <p className="text-xs text-slate-500">Activities and interruptions</p>
        </div>
      </div>

      <div className="space-y-2.5">
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
                className={`rounded-xl border-l-4 ${categoryColor} p-3.5 border border-slate-200/80 bg-white transition-shadow hover:shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{activity.category}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                      </span>
                    </div>
                    {activity.note && (
                      <p className="text-sm text-slate-600 mt-1">{activity.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
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
                className="rounded-xl border-l-4 border-red-500 bg-red-50/80 p-3.5 border border-slate-200/80 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-700">{interruption.type}</span>
                      <span className="text-xs text-red-600 font-medium">
                        {format(time, 'h:mm a')}
                        {interruption.end_time && ` - ${format(parseISO(interruption.end_time), 'h:mm a')}`}
                      </span>
                    </div>
                    {interruption.note && (
                      <p className="text-sm text-slate-600 mt-1">{interruption.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
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
                className={`rounded-xl border-l-4 border-slate-400 bg-slate-50 p-3.5 border border-slate-200/80 ${
                  isCompleted ? 'opacity-70' : ''
                } transition-shadow hover:shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Target className="h-4 w-4 text-slate-500" />
                      )}
                      <span className={`text-sm font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {planned.description}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {planned.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        planned.priority === 'high' ? 'bg-red-100 text-red-700' :
                        planned.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-600'
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

      {activities.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 py-3 px-2">
              <div className="text-xl font-bold text-slate-900">{activities.length}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Activities</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-3 px-2">
              <div className="text-xl font-bold text-slate-900">
                {Math.round(activities.reduce((sum, a) => {
                  const start = parseISO(a.start_time)
                  const end = parseISO(a.end_time)
                  return sum + differenceInMinutes(end, start)
                }, 0) / 60 * 10) / 10}h
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Total time</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-3 px-2">
              <div className="text-xl font-bold text-red-600">{interruptions.length}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Interruptions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
