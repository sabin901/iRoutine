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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Plan</h2>
        <p className="mt-1 text-sm text-gray-500">
          {isToday(parseISO(today)) ? 'Set your intentions for today' : `Plan for ${format(parseISO(today), 'MMMM d')}`}
        </p>
      </div>

      {/* Focus Hours Goal */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Planned Focus Hours
        </label>
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
            className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">hours of focused work</span>
        </div>
      </div>

      {/* Goals */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Goals {totalGoals > 0 && `(${completedGoalsCount}/${totalGoals})`}
          </label>
        </div>
        <div className="space-y-2">
          {plan?.goals.map((goal, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              <button
                onClick={() => toggleGoalComplete(index)}
                className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isGoalCompleted(index) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  isGoalCompleted(index)
                    ? 'text-gray-400 line-through'
                    : 'text-gray-900'
                }`}
              >
                {goal}
              </span>
              <button
                onClick={() => removeGoal(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Add a goal..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addGoal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Planned Activities */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Planned Time Blocks
          </label>
          {!showAddActivity && (
            <button
              onClick={() => setShowAddActivity(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Block
            </button>
          )}
        </div>
        {showAddActivity && (
          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <input
              type="text"
              value={newActivity.description || ''}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder="What will you work on?"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={newActivity.planned_start}
                  onChange={(e) => setNewActivity({ ...newActivity, planned_start: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={newActivity.planned_end}
                  onChange={(e) => setNewActivity({ ...newActivity, planned_end: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as ActivityCategory })}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newActivity.priority}
                onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value as 'high' | 'medium' | 'low' })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPlannedActivity}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddActivity(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{activity.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                    activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {activity.priority}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {format(parseISO(activity.planned_start), 'h:mm a')} - {format(parseISO(activity.planned_end), 'h:mm a')} • {activity.category}
                </div>
              </div>
              <button
                onClick={() => removePlannedActivity(activity.id)}
                className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {(!plan?.planned_activities || plan.planned_activities.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">
              No planned time blocks yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
