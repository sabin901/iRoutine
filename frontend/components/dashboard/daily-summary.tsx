'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import type { DailyPlan, Activity } from '@/lib/types'
import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export function DailySummary() {
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [actualFocusHours, setActualFocusHours] = useState(0)
  const [totalInterruptionMinutes, setTotalInterruptionMinutes] = useState(0)
  const [completedGoals, setCompletedGoals] = useState(0)
  const [reflection, setReflection] = useState('')
  const [showReflection, setShowReflection] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Load plan
    const plans = JSON.parse(localStorage.getItem('routine_daily_plans') || '[]')
    const todayPlan = plans.find((p: DailyPlan) => p.date === today)
    setPlan(todayPlan)

    // Calculate actual focus hours
    const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
    const todayActivities = activities.filter((a: Activity) => {
      const activityDate = format(parseISO(a.start_time), 'yyyy-MM-dd')
      return activityDate === today
    })

    const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
    const focusActivities = todayActivities.filter((a: Activity) =>
      focusCategories.includes(a.category)
    )

    const totalMinutes = focusActivities.reduce((sum: number, a: Activity) => {
      const start = parseISO(a.start_time)
      const end = parseISO(a.end_time)
      return sum + (end.getTime() - start.getTime()) / 1000 / 60
    }, 0)

    setActualFocusHours(Math.round((totalMinutes / 60) * 10) / 10)

    // Calculate total interruption time
    const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
    const todayInterruptions = interruptions.filter((i: any) => {
      const interruptionDate = format(parseISO(i.time), 'yyyy-MM-dd')
      return interruptionDate === today
    })

    const totalInterruptionMins = todayInterruptions.reduce((sum: number, i: any) => {
      if (i.duration_minutes) {
        return sum + i.duration_minutes
      } else if (i.end_time) {
        const start = parseISO(i.time)
        const end = parseISO(i.end_time)
        return sum + Math.round((end.getTime() - start.getTime()) / 1000 / 60)
      }
      return sum + 5 // Default 5 minutes if no duration
    }, 0)

    setTotalInterruptionMinutes(totalInterruptionMins)

    // Count completed goals
    const completed = JSON.parse(localStorage.getItem('routine_completed_goals') || '{}')
    const completedCount = todayPlan?.goals.filter((_, i) => completed[`${today}-${i}`]).length || 0
    setCompletedGoals(completedCount)

    // Load reflection
    const reviews = JSON.parse(localStorage.getItem('routine_daily_reviews') || '[]')
    const todayReview = reviews.find((r: any) => r.date === today)
    if (todayReview?.reflection) {
      setReflection(todayReview.reflection)
      setShowReflection(true)
    }
  }

  const saveReflection = () => {
    const reviews = JSON.parse(localStorage.getItem('routine_daily_reviews') || '[]')
    const existingIndex = reviews.findIndex((r: any) => r.date === today)
    
    const review = {
      id: Date.now().toString(),
      date: today,
      plan_id: plan?.id || null,
      goals_met: completedGoals === (plan?.goals.length || 0) ? 'yes' :
                 completedGoals > 0 ? 'partial' : 'no',
      actual_focus_hours: actualFocusHours,
      reflection: reflection.trim() || null,
      created_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      reviews[existingIndex] = review
    } else {
      reviews.push(review)
    }

    localStorage.setItem('routine_daily_reviews', JSON.stringify(reviews))
    setShowReflection(true)
  }

  if (!plan) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500 text-center py-4">
          Set a daily plan to see your summary
        </p>
      </div>
    )
  }

  const goalsProgress = plan.goals.length > 0 ? (completedGoals / plan.goals.length) * 100 : 0
  const focusProgress = plan.planned_focus_hours > 0 
    ? Math.min((actualFocusHours / plan.planned_focus_hours) * 100, 100) 
    : 0
  const timeAccuracy = plan.planned_focus_hours > 0
    ? Math.round((actualFocusHours / plan.planned_focus_hours) * 100)
    : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Summary</h2>
        <p className="mt-1 text-sm text-gray-500">
          How did your day align with your plan?
        </p>
      </div>

      <div className="space-y-6">
        {/* Goals Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Goals</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {completedGoals} / {plan.goals.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${goalsProgress}%` }}
            />
          </div>
        </div>

        {/* Focus Hours Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Focus Time</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {actualFocusHours}h / {plan.planned_focus_hours}h
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                focusProgress >= 100 ? 'bg-green-500' :
                focusProgress >= 75 ? 'bg-blue-500' :
                focusProgress >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${focusProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {timeAccuracy}% of planned time
            {timeAccuracy < 80 && ' • Consider adjusting your planning'}
          </p>
        </div>

        {/* Interruption Time */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Interruptions</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {Math.floor(totalInterruptionMinutes / 60)}h {totalInterruptionMinutes % 60}m
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${Math.min((totalInterruptionMinutes / 60 / 8) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {totalInterruptionMinutes > 0 
              ? `${totalInterruptionMinutes} minutes of interruptions today`
              : 'No interruptions logged'}
          </p>
        </div>

        {/* Time Accuracy Insight */}
        {plan.planned_focus_hours > 0 && (
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {timeAccuracy >= 90 
                    ? 'Great planning accuracy!'
                    : timeAccuracy >= 70
                    ? 'Close to your plan'
                    : 'Consider planning less time'}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  {timeAccuracy >= 90
                    ? 'You\'re accurately estimating your focus time.'
                    : timeAccuracy >= 70
                    ? 'You\'re within 30% of your planned time.'
                    : 'You planned more time than you actually focused. Try reducing by 20-30%.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reflection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Reflection
          </label>
          {!showReflection ? (
            <button
              onClick={() => setShowReflection(true)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 text-left"
            >
              Add reflection...
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What worked well? What would you do differently?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={saveReflection}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Save Reflection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
