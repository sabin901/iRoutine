'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { parseISO, subDays, startOfDay } from 'date-fns'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { detectPatterns, type PatternDetection } from '@/lib/advanced-insights'

export function PatternDetector() {
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
        const weekStart = startOfDay(subDays(new Date(), 14))
        
        const recentActivities = storedActivities.filter((a: any) => {
          const start = parseISO(a.start_time)
          return start >= weekStart
        })
        
        const recentInterruptions = storedInterruptions.filter((i: any) => {
          const time = parseISO(i.time)
          return time >= weekStart
        })
        
        setActivities(recentActivities)
        setInterruptions(recentInterruptions)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const weekStart = startOfDay(subDays(new Date(), 14))

      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())

      const { data: interruptionsData } = await supabase
        .from('interruptions')
        .select('*')
        .eq('user_id', user.id)
        .gte('time', weekStart.toISOString())

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
          <div className="h-4 bg-neutral-100 rounded-lg w-1/2"></div>
          <div className="h-32 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (activities.length < 3) {
    return (
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg">
        <div className="text-center py-12">
          <Brain className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium">
            Need more data to detect patterns. Keep tracking!
          </p>
        </div>
      </div>
    )
  }

  const patterns = detectPatterns(activities, interruptions)

  const getPatternIcon = (type: PatternDetection['type']) => {
    switch (type) {
      case 'positive':
        return CheckCircle2
      case 'negative':
        return AlertTriangle
      default:
        return Sparkles
    }
  }

  const getPatternColor = (type: PatternDetection['type']) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-success-50',
          border: 'border-success-200/50',
          text: 'text-success-900',
          subtext: 'text-success-700',
          badge: 'bg-success-100 text-success-700',
        }
      case 'negative':
        return {
          bg: 'bg-danger-50',
          border: 'border-danger-200/50',
          text: 'text-danger-900',
          subtext: 'text-danger-700',
          badge: 'bg-danger-100 text-danger-700',
        }
      default:
        return {
          bg: 'bg-primary-50',
          border: 'border-primary-200/50',
          text: 'text-primary-900',
          subtext: 'text-primary-700',
          badge: 'bg-primary-100 text-primary-700',
        }
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-soft-lg card-hover">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-glow-primary">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">AI Pattern Detection</h2>
            <p className="text-xs text-neutral-500">Discovered patterns in your behavior and productivity</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {patterns.map((pattern, idx) => {
          const Icon = getPatternIcon(pattern.type)
          const colors = getPatternColor(pattern.type)

          return (
            <div
              key={idx}
              className={`rounded-xl p-4 border transition-all hover:shadow-md ${colors.bg} ${colors.border} animate-slide-up`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.badge}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-semibold ${colors.text}`}>
                      {pattern.pattern}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {pattern.confidence}% confidence
                    </span>
                  </div>
                  <p className={`text-sm ${colors.subtext} mb-2`}>
                    {pattern.description}
                  </p>
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-opacity-20 border-gray-400">
                    <Sparkles className={`h-3 w-3 mt-0.5 ${colors.subtext}`} />
                    <p className={`text-xs ${colors.subtext} italic`}>
                      {pattern.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {patterns.length === 0 && (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No clear patterns detected yet. Keep tracking consistently!
          </p>
        </div>
      )}

      {/* Summary */}
      {patterns.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {patterns.filter(p => p.type === 'positive').length}
              </div>
              <div className="text-xs text-gray-500">Strengths</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {patterns.filter(p => p.type === 'neutral').length}
              </div>
              <div className="text-xs text-gray-500">Observations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {patterns.filter(p => p.type === 'negative').length}
              </div>
              <div className="text-xs text-gray-500">Improvements</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
