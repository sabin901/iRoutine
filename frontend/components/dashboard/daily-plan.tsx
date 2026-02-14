'use client'

import { useState, useEffect } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import type { DailyPlan, PlannedActivity, ActivityCategory } from '@/lib/types'
import { Plus, X, CheckCircle2, Circle } from 'lucide-react'

const categories: ActivityCategory[] = [
  'Study',
  'Coding',
  'Work',
  'Reading',
  'Rest',
  'Social',
  'Other',
]

export function DailyPlanComponent() {
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [newGoal, setNewGoal] = useState('')
  const [plannedHours, setPlannedHours] = useState(6)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState<Partial<PlannedActivity>>({
    description: '',
    category: 'Work',
    planned_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    planned_end: format(new Date(Date.now() + 2 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium',
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTodayPlan()
  }, [])

  const loadTodayPlan = () => {
    const plans = JSON.parse(localStorage.getItem('routine_daily_plans') || '[]')
    const todayPlan = plans.find((p: DailyPlan) => p.date === today)
    if (todayPlan) {
      setPlan(todayPlan)
      setPlannedHours(todayPlan.planned_focus_hours)
    }
  }

  const savePlan = (updatedPlan: DailyPlan) => {
    const plans = JSON.parse(localStorage.getItem('routine_daily_plans') || '[]')
    const existingIndex = plans.findIndex((p: DailyPlan) => p.date === today)
    
    if (existingIndex >= 0) {
      plans[existingIndex] = updatedPlan
    } else {
      plans.push(updatedPlan)
    }
    
    localStorage.setItem('routine_daily_plans', JSON.stringify(plans))
    setPlan(updatedPlan)
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    
    const updatedPlan: DailyPlan = plan || {
      id: Date.now().toString(),
      date: today,
      goals: [],
      planned_focus_hours: plannedHours,
      planned_activities: [],
      created_at: new Date().toISOString(),
    }
    
    updatedPlan.goals.push(newGoal.trim())
    savePlan(updatedPlan)
    setNewGoal('')
  }

  const removeGoal = (index: number) => {
    if (!plan) return
    const updatedPlan = { ...plan }
    updatedPlan.goals.splice(index, 1)
    savePlan(updatedPlan)
  }

  const toggleGoalComplete = (index: number) => {
    // Store completed goals separately for tracking
    const completed = JSON.parse(localStorage.getItem('routine_completed_goals') || '{}')
    const key = `${today}-${index}`
    completed[key] = !completed[key]
    localStorage.setItem('routine_completed_goals', JSON.stringify(completed))
    // Force re-render
    loadTodayPlan()
  }

  const isGoalCompleted = (index: number) => {
    const completed = JSON.parse(localStorage.getItem('routine_completed_goals') || '{}')
    return completed[`${today}-${index}`] || false
  }

  const addPlannedActivity = () => {
    if (!newActivity.description?.trim() || !newActivity.planned_start || !newActivity.planned_end) return
    
    const updatedPlan: DailyPlan = plan || {
      id: Date.now().toString(),
      date: today,
      goals: [],
      planned_focus_hours: plannedHours,
      planned_activities: [],
      created_at: new Date().toISOString(),
    }
    
    updatedPlan.planned_activities.push({
      id: Date.now().toString(),
      description: newActivity.description,
      category: newActivity.category!,
      planned_start: newActivity.planned_start,
      planned_end: newActivity.planned_end,
      priority: newActivity.priority!,
    })
    
    savePlan(updatedPlan)
    setNewActivity({
      description: '',
      category: 'Work',
      planned_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      planned_end: format(new Date(Date.now() + 2 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      priority: 'medium',
    })
    setShowAddActivity(false)
  }

  const removePlannedActivity = (id: string) => {
    if (!plan) return
    const updatedPlan = { ...plan }
    updatedPlan.planned_activities = updatedPlan.planned_activities.filter(a => a.id !== id)
    savePlan(updatedPlan)
  }

  const updatePlannedHours = (hours: number) => {
    const updatedPlan: DailyPlan = plan || {
      id: Date.now().toString(),
      date: today,
      goals: [],
      planned_focus_hours: hours,
      planned_activities: [],
      created_at: new Date().toISOString(),
    }
    updatedPlan.planned_focus_hours = hours
    savePlan(updatedPlan)
  }

  const completedGoalsCount = plan?.goals.filter((_, i) => isGoalCompleted(i)).length || 0
  const totalGoals = plan?.goals.length || 0

  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Plan</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalGoals > 0 ? `${completedGoalsCount}/${totalGoals} goals` : 'Set your intentions'}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-slate-50/80 border border-slate-200 p-3.5">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Planned focus</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="12"
            value={plannedHours}
            onChange={(e) => {
              const hours = parseInt(e.target.value) || 0
              setPlannedHours(hours)
              updatePlannedHours(hours)
            }}
            className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          <span className="text-sm text-slate-500">hours</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Goals</label>
        <div className="space-y-1.5">
          {plan?.goals.map((goal, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5"
            >
              <button
                onClick={() => toggleGoalComplete(index)}
                className="mt-0.5 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {isGoalCompleted(index) ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
              <span className={`flex-1 text-sm ${isGoalCompleted(index) ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                {goal}
              </span>
              <button onClick={() => removeGoal(index)} className="text-slate-500 hover:text-red-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Add a goal..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={addGoal}
            className="rounded-xl btn-primary p-2.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time blocks</label>
          {!showAddActivity && (
            <button
              onClick={() => setShowAddActivity(true)}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              + Add block
            </button>
          )}
        </div>
        {showAddActivity && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <input
              type="text"
              value={newActivity.description || ''}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder="What will you work on?"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={newActivity.planned_start}
                  onChange={(e) => setNewActivity({ ...newActivity, planned_start: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={newActivity.planned_end}
                  onChange={(e) => setNewActivity({ ...newActivity, planned_end: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as ActivityCategory })}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newActivity.priority}
                onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value as 'high' | 'medium' | 'low' })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPlannedActivity}
                className="flex-1 rounded-lg btn-primary px-4 py-2 text-sm font-medium"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddActivity(false)}
                className="rounded-lg btn-secondary px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {plan?.planned_activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{activity.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                    activity.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {activity.priority}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {format(parseISO(activity.planned_start), 'h:mm a')} - {format(parseISO(activity.planned_end), 'h:mm a')} • {activity.category}
                </div>
              </div>
              <button
                onClick={() => removePlannedActivity(activity.id)}
                className="ml-3 text-slate-500 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(!plan?.planned_activities || plan.planned_activities.length === 0) && (
            <p className="text-sm text-slate-500 text-center py-4">No planned time blocks yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
