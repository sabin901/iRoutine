'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { Trophy, Target, Zap, Star, Calendar, TrendingUp } from 'lucide-react'
import { calculateAverageFocusQuality } from '@/lib/interruption-metrics'

interface Achievement {
  id: string
  name: string
  description: string
  icon: typeof Trophy
  unlocked: boolean
  progress: number
  maxProgress: number
  color: string
}

export function AchievementsPanel() {
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
        setActivities(storedActivities)
        setInterruptions(storedInterruptions)
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

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: false })

      setActivities(activitiesData || [])
      setInterruptions(interruptionsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const achievements = useMemo(() => {
    const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
    const focusActivities = activities.filter(a => focusCategories.includes(a.category))
    
    const totalFocusMinutes = focusActivities.reduce((sum, a) => {
      const start = new Date(a.start_time)
      const end = new Date(a.end_time)
      return sum + (end.getTime() - start.getTime()) / 1000 / 60
    }, 0)

    const qualityMetrics = calculateAverageFocusQuality(activities, interruptions)
    
    const daysWithActivity = new Set(activities.map(a => {
      const date = new Date(a.start_time)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    })).size

    const achievements: Achievement[] = [
      {
        id: 'first-log',
        name: 'Getting Started',
        description: 'Log your first activity',
        icon: Target,
        unlocked: activities.length > 0,
        progress: activities.length > 0 ? 1 : 0,
        maxProgress: 1,
        color: 'blue',
      },
      {
        id: 'focus-hours',
        name: 'Focus Master',
        description: 'Log 10 hours of focus time',
        icon: Zap,
        unlocked: totalFocusMinutes >= 600,
        progress: Math.min(totalFocusMinutes / 60, 10),
        maxProgress: 10,
        color: 'purple',
      },
      {
        id: 'quality',
        name: 'Quality Focus',
        description: 'Achieve 80% average focus quality',
        icon: Star,
        unlocked: qualityMetrics.avg_quality >= 80,
        progress: qualityMetrics.avg_quality,
        maxProgress: 100,
        color: 'yellow',
      },
      {
        id: 'consistency',
        name: 'Consistent Tracker',
        description: 'Log activities for 7 days',
        icon: Calendar,
        unlocked: daysWithActivity >= 7,
        progress: daysWithActivity,
        maxProgress: 7,
        color: 'green',
      },
      {
        id: 'improvement',
        name: 'On the Rise',
        description: 'Improve focus quality by 20%',
        icon: TrendingUp,
        unlocked: false, // Would need historical data
        progress: 0,
        maxProgress: 20,
        color: 'orange',
      },
    ]

    return achievements
  }, [activities, interruptions])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Achievements</h2>
        </div>
        <span className="text-xs font-semibold text-slate-500">{unlockedCount}/{achievements.length}</span>
      </div>

      <div className="space-y-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          const progressPercent = (achievement.progress / achievement.maxProgress) * 100

          return (
            <div
              key={achievement.id}
              className={`rounded-xl p-4 border transition-all ${
                achievement.unlocked
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold ${achievement.unlocked ? 'text-slate-900' : 'text-slate-700'}`}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{achievement.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progress</span>
                      <span className={`font-medium ${achievement.unlocked ? 'text-amber-700' : 'text-slate-600'}`}>
                        {achievement.maxProgress === 1 
                          ? (achievement.unlocked ? 'Complete' : 'Incomplete')
                          : `${Math.round(achievement.progress)} / ${achievement.maxProgress}`
                        }
                      </span>
                    </div>
                    {achievement.maxProgress > 1 && (
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            achievement.unlocked ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
