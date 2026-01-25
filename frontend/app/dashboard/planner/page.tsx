'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, 
  Circle,
  Plus,
  Calendar,
  Target,
  Flame,
  Clock,
  AlertCircle,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react'
import type { Task, Goal, Habit, HabitLog, TodaySummary } from '@/lib/types'

const TASK_CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Errands', 'Other']
const GOAL_CATEGORIES = ['Career', 'Health', 'Learning', 'Financial', 'Personal', 'Relationships', 'Other']
const PRIORITY_COLORS = {
  low: 'bg-neutral-100 text-neutral-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState({ tasks_completed: 0, tasks_total: 0, habits_completed: 0, habits_total: 0 })
  const [loading, setLoading] = useState(true)
  
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'tasks' | 'habits' | 'goals'>('today')

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'Personal',
    estimated_minutes: ''
  })

  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekdays' | 'weekly',
    icon: '✓',
    color: '#6172f3'
  })

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'Personal' as any,
    target_date: '',
    color: '#6172f3'
  })

  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Fetch today's tasks
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', today)
      .order('priority', { ascending: false })

    if (todayTasks) setTasks(todayTasks)

    // Fetch overdue tasks
    const { data: overdue } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .lt('due_date', today)
      .neq('status', 'completed')
      .neq('status', 'cancelled')

    if (overdue) setOverdueTasks(overdue)

    // Fetch habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (habitsData) setHabits(habitsData)

    // Fetch today's habit logs
    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)

    if (logsData) setHabitLogs(logsData)

    // Fetch active goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (goalsData) setGoals(goalsData)

    // Calculate stats
    const completedTasks = todayTasks?.filter(t => t.status === 'completed').length || 0
    const completedHabitIds = new Set(logsData?.filter(l => l.completed).map(l => l.habit_id) || [])

    setStats({
      tasks_completed: completedTasks,
      tasks_total: todayTasks?.length || 0,
      habits_completed: completedHabitIds.size,
      habits_total: habitsData?.length || 0
    })

    setLoading(false)
  }

  const addTask = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !taskForm.title) return

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: taskForm.title,
      description: taskForm.description || null,
      due_date: taskForm.due_date,
      priority: taskForm.priority,
      category: taskForm.category,
      estimated_minutes: taskForm.estimated_minutes ? parseInt(taskForm.estimated_minutes) : null
    })

    if (!error) {
      setShowAddTask(false)
      setTaskForm({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        category: 'Personal',
        estimated_minutes: ''
      })
      fetchData()
    }
  }

  const addHabit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !habitForm.name) return

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: habitForm.name,
      description: habitForm.description || null,
      frequency: habitForm.frequency,
      icon: habitForm.icon,
      color: habitForm.color
    })

    if (!error) {
      setShowAddHabit(false)
      setHabitForm({ name: '', description: '', frequency: 'daily', icon: '✓', color: '#6172f3' })
      fetchData()
    }
  }

  const addGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !goalForm.title) return

    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      title: goalForm.title,
      description: goalForm.description || null,
      category: goalForm.category,
      target_date: goalForm.target_date || null,
      color: goalForm.color
    })

    if (!error) {
      setShowAddGoal(false)
      setGoalForm({ title: '', description: '', category: 'Personal', target_date: '', color: '#6172f3' })
      fetchData()
    }
  }

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('tasks').update({ 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    }).eq('id', task.id)
    fetchData()
  }

  const toggleHabit = async (habit: Habit) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const existingLog = habitLogs.find(l => l.habit_id === habit.id)

    if (existingLog) {
      await supabase.from('habit_logs').update({ completed: !existingLog.completed }).eq('id', existingLog.id)
    } else {
      await supabase.from('habit_logs').insert({
        user_id: user.id,
        habit_id: habit.id,
        date: today,
        completed: true
      })
    }
    fetchData()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    fetchData()
  }

  const updateGoalProgress = async (goalId: string, progress: number) => {
    await supabase.from('goals').update({ progress }).eq('id', goalId)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const completedHabitIds = new Set(habitLogs.filter(l => l.completed).map(l => l.habit_id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Planner</h1>
          <p className="text-neutral-600">Plan your day, track habits, achieve goals</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Task
          </button>
          <button
            onClick={() => setShowAddHabit(true)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Flame className="h-4 w-4" />
            Habit
          </button>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Target className="h-4 w-4" />
            Goal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-600 text-sm mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Tasks Today
          </div>
          <p className="text-2xl font-bold">
            {stats.tasks_completed}/{stats.tasks_total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-600 text-sm mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            Habits
          </div>
          <p className="text-2xl font-bold">
            {stats.habits_completed}/{stats.habits_total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-600 text-sm mb-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Overdue
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-neutral-600 text-sm mb-1">
            <Target className="h-4 w-4 text-primary-500" />
            Active Goals
          </div>
          <p className="text-2xl font-bold">{goals.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {(['today', 'tasks', 'habits', 'goals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500" />
              Today&apos;s Tasks
            </h2>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No tasks for today</p>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
                      task.status === 'completed' ? 'bg-green-50' : 'bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <button onClick={() => toggleTaskStatus(task)}>
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-neutral-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.estimated_minutes && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimated_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all"
                    >
                      <X className="h-4 w-4 text-neutral-500" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Overdue */}
            {overdueTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Overdue ({overdueTasks.length})
                </h3>
                {overdueTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg mb-1">
                    <button onClick={() => toggleTaskStatus(task)}>
                      <Circle className="h-4 w-4 text-red-400" />
                    </button>
                    <span className="text-sm text-red-800">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Habits */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Daily Habits
            </h2>
            <div className="space-y-2">
              {habits.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No habits yet</p>
              ) : (
                habits.map(habit => {
                  const isCompleted = completedHabitIds.has(habit.id)
                  return (
                    <div 
                      key={habit.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isCompleted ? 'bg-green-50' : 'bg-neutral-50 hover:bg-neutral-100'
                      }`}
                      onClick={() => toggleHabit(habit)}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${
                          isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-200'
                        }`}
                        style={{ backgroundColor: isCompleted ? habit.color : undefined }}
                      >
                        {isCompleted ? '✓' : habit.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-green-700' : 'text-neutral-900'}`}>
                          {habit.name}
                        </p>
                        {habit.current_streak > 0 && (
                          <p className="text-xs text-orange-600 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {habit.current_streak} day streak
                          </p>
                        )}
                      </div>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="space-y-2">
            {[...overdueTasks, ...tasks].length === 0 ? (
              <p className="text-neutral-500 text-center py-12">No tasks. Add one to get started!</p>
            ) : (
              [...overdueTasks, ...tasks].map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg group ${
                    task.status === 'completed' ? 'bg-green-50' : 
                    overdueTasks.includes(task) ? 'bg-red-50' : 'bg-neutral-50'
                  }`}
                >
                  <button onClick={() => toggleTaskStatus(task)}>
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'completed' ? 'line-through text-neutral-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      <span className={`px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span>{task.category}</span>
                      {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded"
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-white"
                  style={{ backgroundColor: habit.color }}
                >
                  {habit.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{habit.name}</h3>
                  <p className="text-xs text-neutral-500">{habit.frequency}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">{habit.current_streak} day streak</span>
                </div>
                <span className="text-xs text-neutral-500">Best: {habit.best_streak}</span>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <p className="text-neutral-500 col-span-full text-center py-12">No habits yet. Create one!</p>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-6 w-6" style={{ color: goal.color }} />
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="text-xs text-neutral-500">{goal.category}</p>
                </div>
              </div>
              {goal.description && (
                <p className="text-sm text-neutral-600 mb-3">{goal.description}</p>
              )}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {[0, 25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    onClick={() => updateGoalProgress(goal.id, p)}
                    className={`flex-1 py-1 text-xs rounded ${
                      goal.progress >= p ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          ))}
          {goals.length === 0 && (
            <p className="text-neutral-500 col-span-full text-center py-12">No goals yet. Set your first goal!</p>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="What do you need to do?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {TASK_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={taskForm.estimated_minutes}
                  onChange={(e) => setTaskForm(f => ({ ...f, estimated_minutes: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Habit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Morning meditation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Frequency</label>
                <select
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm(f => ({ ...f, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {['✓', '💪', '📚', '🧘', '💧', '🏃', '✍️', '💤', '🎯', '⭐'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setHabitForm(f => ({ ...f, icon }))}
                      className={`w-10 h-10 text-xl rounded-lg border-2 ${
                        habitForm.icon === icon ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Set Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Learn Spanish"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Why is this goal important to you?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm(f => ({ ...f, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {GOAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm(f => ({ ...f, target_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
