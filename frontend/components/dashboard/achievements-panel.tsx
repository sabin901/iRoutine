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
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-100 rounded-lg w-1/2"></div>
          <div className="h-32 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg card-hover">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">Achievements</h2>
        </div>
        <div className="text-sm font-bold text-neutral-500">
          {unlockedCount} / {achievements.length}
        </div>
      </div>

      <div className="space-y-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          const progressPercent = (achievement.progress / achievement.maxProgress) * 100

          return (
            <div
              key={achievement.id}
              className={`rounded-xl p-4 border transition-all hover:shadow-soft ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-warning-50 to-warning-100/50 border-warning-200/50'
                  : 'bg-neutral-50 border-neutral-200/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && (
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className={`font-medium ${
                        achievement.unlocked ? 'text-yellow-700' : 'text-gray-600'
                      }`}>
                        {achievement.maxProgress === 1 
                          ? (achievement.unlocked ? 'Complete' : 'Incomplete')
                          : `${Math.round(achievement.progress)} / ${achievement.maxProgress}`
                        }
                      </span>
                    </div>
                    {achievement.maxProgress > 1 && (
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            achievement.unlocked
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : 'bg-gray-300'
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
