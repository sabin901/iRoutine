'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { parseISO, subDays, startOfDay } from 'date-fns'
import { Lightbulb, Target, Shield, Zap, Clock, TrendingUp } from 'lucide-react'
import { generateAdvancedInsights } from '@/lib/advanced-insights'

export function SmartRecommendations() {
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
      <div className="card rounded-xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (activities.length < 3) {
    return (
      <div className="card rounded-xl p-6">
        <div className="text-center py-12">
          <Lightbulb className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            Track more activities to get personalized recommendations
          </p>
        </div>
      </div>
    )
  }

  const insights = generateAdvancedInsights(activities, interruptions)

  const recommendations = [
    {
      icon: Target,
      title: 'Optimal Focus Window',
      value: insights.predictions.optimalFocusWindow,
      description: 'Schedule your most important work during this window',
      color: 'from-primary-500 to-primary-700',
    },
    {
      icon: Shield,
      title: 'Best Day',
      value: insights.peakPerformance.bestDay,
      description: 'Your most productive day - reserve it for critical tasks',
      color: 'from-success-500 to-success-700',
    },
    {
      icon: TrendingUp,
      title: 'Focus Quality',
      value: insights.correlations.focusQualityTrend,
      description: insights.correlations.focusQualityTrend === 'improving' 
        ? 'Your focus quality is improving - keep it up!' 
        : insights.correlations.focusQualityTrend === 'declining'
        ? 'Your focus quality is declining - time to adjust'
        : 'Your focus quality is stable - good consistency',
      color: insights.correlations.focusQualityTrend === 'improving' 
        ? 'from-success-500 to-success-700'
        : insights.correlations.focusQualityTrend === 'declining'
        ? 'from-danger-500 to-warning-600'
        : 'from-neutral-500 to-neutral-600',
    },
    {
      icon: Clock,
      title: 'Avg Recovery Time',
      value: `${insights.correlations.recoveryTime} min`,
      description: 'Time to refocus after interruptions',
      color: 'from-warning-500 to-danger-600',
    },
  ]

  return (
    <div className="card rounded-xl p-6 card-hover">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <Lightbulb className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Smart Recommendations</h2>
            <p className="text-xs text-slate-500">Personalized insights based on your data</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon
          return (
            <div
              key={idx}
              className="rounded-xl p-4 bg-slate-100/50 border border-slate-200 transition-all animate-scale-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="inline-flex p-2.5 rounded-xl bg-slate-200 mb-3">
                <Icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">{rec.title}</div>
              <div className="text-lg font-bold text-slate-900 mb-1 capitalize">{rec.value}</div>
              <div className="text-xs text-slate-500">{rec.description}</div>
            </div>
          )
        })}
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-slate-900 mb-3">Recommended Actions</div>
        {insights.predictions.recommendations.map((recommendation, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30 transition-all animate-slide-up"
            style={{ animationDelay: `${(idx + 4) * 100}ms` }}
          >
            <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-200 font-medium">{recommendation}</p>
          </div>
        ))}
        {insights.predictions.recommendations.length === 0 && (
          <div className="text-center py-6 text-sm text-neutral-500">
            You&apos;re doing great! Keep up the good work.
          </div>
        )}
      </div>

      {/* Risk Periods Warning */}
      {insights.predictions.riskPeriods.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4 border border-red-500/30">
            <Shield className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-300 mb-1">High-Risk Periods</div>
              <div className="text-xs text-slate-500">
                Avoid scheduling important work during: {insights.predictions.riskPeriods.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
