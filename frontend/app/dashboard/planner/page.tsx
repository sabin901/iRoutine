'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus,
  Calendar,
  ListChecks,
  Repeat2,
  Target,
  Clock,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react'
import type { GoalCategory, HabitFrequency, Task, Goal, Habit, HabitLog, TaskPriority } from '@/lib/types'
import { EmptyState, InsightStrip, PageHeader } from '@/components/dashboard/section-shell'
import { ensureDemoWorkspaceSeeded } from '@/lib/demo-data'
import { isDemoMode } from '@/lib/env'

const TASK_CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Errands', 'Other']
const GOAL_CATEGORIES = ['Career', 'Health', 'Learning', 'Financial', 'Personal', 'Relationships', 'Other']
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const HABIT_FREQUENCIES: HabitFrequency[] = ['daily', 'weekdays', 'weekly']
const HABIT_MARKERS = ['Focus', 'Move', 'Read', 'Plan', 'Water', 'Write', 'Sleep', 'Review']
const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-amber-50 text-amber-600',
  urgent: 'bg-red-50 text-red-600'
}

function getLocalDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().split('T')[0]
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
    due_date: getLocalDateString(),
    priority: 'medium' as TaskPriority,
    category: 'Personal',
    estimated_minutes: ''
  })

  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    frequency: 'daily' as HabitFrequency,
    icon: 'Focus',
    color: '#6172f3'
  })

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'Personal' as GoalCategory,
    target_date: '',
    color: '#6172f3'
  })

  const supabase = createClient()
  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        ensureDemoWorkspaceSeeded()
        const today = getLocalDateString()
        const allTasks = JSON.parse(localStorage.getItem('routine_tasks') || '[]') as Task[]
        const activeHabits = JSON.parse(localStorage.getItem('routine_habits') || '[]') as Habit[]
        const logs = JSON.parse(localStorage.getItem('routine_habit_logs') || '[]') as HabitLog[]
        const activeGoals = JSON.parse(localStorage.getItem('routine_goals') || '[]') as Goal[]
        const todayTasks = allTasks.filter(task => task.due_date === today)
        const overdue = allTasks.filter(task => task.due_date && task.due_date < today && task.status !== 'completed' && task.status !== 'cancelled')
        const todayLogs = logs.filter(log => log.date === today)
        const completedHabitIds = new Set(todayLogs.filter(log => log.completed).map(log => log.habit_id))

        setTasks(todayTasks)
        setOverdueTasks(overdue)
        setHabits(activeHabits.filter(habit => habit.is_active))
        setHabitLogs(todayLogs)
        setGoals(activeGoals.filter(goal => goal.status === 'active'))
        setStats({
          tasks_completed: todayTasks.filter(task => task.status === 'completed').length,
          tasks_total: todayTasks.length,
          habits_completed: completedHabitIds.size,
          habits_total: activeHabits.filter(habit => habit.is_active).length,
        })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = getLocalDateString()

      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', today)
        .order('priority', { ascending: false })

      if (todayTasks) setTasks(todayTasks)

      const { data: overdue } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .lt('due_date', today)
        .neq('status', 'completed')
        .neq('status', 'cancelled')

      if (overdue) setOverdueTasks(overdue)

      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (habitsData) setHabits(habitsData)

      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)

      if (logsData) setHabitLogs(logsData)

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (goalsData) setGoals(goalsData)

      const completedTasks = todayTasks?.filter(t => t.status === 'completed').length || 0
      const completedHabitIds = new Set(logsData?.filter(l => l.completed).map(l => l.habit_id) || [])

      setStats({
        tasks_completed: completedTasks,
        tasks_total: todayTasks?.length || 0,
        habits_completed: completedHabitIds.size,
        habits_total: habitsData?.length || 0
      })
    } catch (err) {
      console.error('Failed to load planner data:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (isDemoMode()) {
      if (!taskForm.title) return
      const allTasks = JSON.parse(localStorage.getItem('routine_tasks') || '[]') as Task[]
      allTasks.unshift({
        id: crypto.randomUUID(),
        user_id: 'demo-user',
        title: taskForm.title,
        description: taskForm.description || null,
        due_date: taskForm.due_date,
        due_time: null,
        priority: taskForm.priority,
        status: 'pending',
        category: taskForm.category,
        estimated_minutes: taskForm.estimated_minutes ? parseInt(taskForm.estimated_minutes) : null,
        actual_minutes: null,
        completed_at: null,
        is_recurring: false,
        recurring_pattern: null,
        energy_required: null,
        avoidance_count: 0,
        last_postponed_at: null,
        breakdown_suggested: false,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('routine_tasks', JSON.stringify(allTasks))
      setShowAddTask(false)
      setTaskForm({ title: '', description: '', due_date: getLocalDateString(), priority: 'medium', category: 'Personal', estimated_minutes: '' })
      fetchData()
      return
    }

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
        due_date: getLocalDateString(),
        priority: 'medium',
        category: 'Personal',
        estimated_minutes: ''
      })
      fetchData()
    }
  }

  const addHabit = async () => {
    if (isDemoMode()) {
      if (!habitForm.name) return
      const allHabits = JSON.parse(localStorage.getItem('routine_habits') || '[]') as Habit[]
      allHabits.unshift({
        id: crypto.randomUUID(),
        user_id: 'demo-user',
        name: habitForm.name,
        description: habitForm.description || null,
        frequency: habitForm.frequency,
        target_count: 1,
        color: habitForm.color,
        icon: habitForm.icon,
        is_active: true,
        current_streak: 0,
        best_streak: 0,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('routine_habits', JSON.stringify(allHabits))
      setShowAddHabit(false)
      setHabitForm({ name: '', description: '', frequency: 'daily', icon: 'Focus', color: '#6172f3' })
      fetchData()
      return
    }

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
      setHabitForm({ name: '', description: '', frequency: 'daily', icon: 'Focus', color: '#6172f3' })
      fetchData()
    }
  }

  const addGoal = async () => {
    if (isDemoMode()) {
      if (!goalForm.title) return
      const allGoals = JSON.parse(localStorage.getItem('routine_goals') || '[]') as Goal[]
      allGoals.unshift({
        id: crypto.randomUUID(),
        user_id: 'demo-user',
        title: goalForm.title,
        description: goalForm.description || null,
        category: goalForm.category,
        target_date: goalForm.target_date || null,
        status: 'active',
        progress: 0,
        milestones: [],
        color: goalForm.color,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('routine_goals', JSON.stringify(allGoals))
      setShowAddGoal(false)
      setGoalForm({ title: '', description: '', category: 'Personal', target_date: '', color: '#6172f3' })
      fetchData()
      return
    }

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
    if (isDemoMode()) {
      const allTasks = JSON.parse(localStorage.getItem('routine_tasks') || '[]') as Task[]
      localStorage.setItem('routine_tasks', JSON.stringify(allTasks.map(item => (
        item.id === task.id ? { ...item, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : item
      ))))
      fetchData()
      return
    }

    await supabase.from('tasks').update({ 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    }).eq('id', task.id)
    fetchData()
  }

  const toggleHabit = async (habit: Habit) => {
    if (isDemoMode()) {
      const today = getLocalDateString()
      const logs = JSON.parse(localStorage.getItem('routine_habit_logs') || '[]') as HabitLog[]
      const existingLog = logs.find(log => log.habit_id === habit.id && log.date === today)
      const nextLogs = existingLog
        ? logs.map(log => log.id === existingLog.id ? { ...log, completed: !log.completed } : log)
        : [...logs, { id: crypto.randomUUID(), habit_id: habit.id, user_id: 'demo-user', date: today, completed: true, count: 1, note: null, created_at: new Date().toISOString() }]
      localStorage.setItem('routine_habit_logs', JSON.stringify(nextLogs))
      fetchData()
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = getLocalDateString()
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
    if (isDemoMode()) {
      const allTasks = JSON.parse(localStorage.getItem('routine_tasks') || '[]') as Task[]
      localStorage.setItem('routine_tasks', JSON.stringify(allTasks.filter(task => task.id !== id)))
      fetchData()
      return
    }

    await supabase.from('tasks').delete().eq('id', id)
    fetchData()
  }

  const updateGoalProgress = async (goalId: string, progress: number) => {
    if (isDemoMode()) {
      const allGoals = JSON.parse(localStorage.getItem('routine_goals') || '[]') as Goal[]
      localStorage.setItem('routine_goals', JSON.stringify(allGoals.map(goal => (
        goal.id === goalId ? { ...goal, progress } : goal
      ))))
      fetchData()
      return
    }

    await supabase.from('goals').update({ progress }).eq('id', goalId)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300" />
      </div>
    )
  }

  const completedHabitIds = new Set(habitLogs.filter(l => l.completed).map(l => l.habit_id))
  const taskCompletionRate = stats.tasks_total > 0 ? Math.round((stats.tasks_completed / stats.tasks_total) * 100) : 0
  const habitCompletionRate = stats.habits_total > 0 ? Math.round((stats.habits_completed / stats.habits_total) * 100) : 0
  const highPriorityTasks = [...overdueTasks, ...tasks].filter((task) => task.priority === 'high' || task.priority === 'urgent').length
  const nextGoal = goals.find((goal) => goal.target_date)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        icon={Calendar}
        section="Planner"
        title="Execution Planner"
        description="Turn intentions into tasks, habits, and goal progress without losing sight of overdue work or energy demand."
        action={
          <>
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
            >
              <Plus className="h-4 w-4" />
              Task
            </button>
            <button
              onClick={() => setShowAddHabit(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            >
              Habit
            </button>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            >
              Goal
            </button>
          </>
        }
      >
        <InsightStrip
          items={[
            { label: 'Task progress', value: stats.tasks_total ? `${taskCompletionRate}% complete today` : 'No tasks due today', tone: taskCompletionRate >= 70 ? 'emerald' : 'amber' },
            { label: 'Habit pulse', value: stats.habits_total ? `${habitCompletionRate}% checked off` : 'No active habits yet', tone: habitCompletionRate >= 70 ? 'emerald' : 'sky' },
            { label: 'Priority load', value: highPriorityTasks ? `${highPriorityTasks} high-pressure item${highPriorityTasks === 1 ? '' : 's'}` : 'No urgent pressure', tone: highPriorityTasks ? 'red' : 'emerald' },
            { label: 'Next milestone', value: nextGoal?.target_date ? `${nextGoal.title} by ${new Date(nextGoal.target_date).toLocaleDateString()}` : 'Add a goal target date', tone: 'slate' },
          ]}
        />
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <ListChecks className="h-4 w-4 text-sky-600" />
            Tasks Today
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.tasks_completed}/{stats.tasks_total}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Repeat2 className="h-4 w-4 text-emerald-600" />
            Habits
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.habits_completed}/{stats.habits_total}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Overdue
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Target className="h-4 w-4 text-slate-500" />
            Active Goals
          </div>
          <p className="text-2xl font-bold text-slate-900">{goals.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['today', 'tasks', 'habits', 'goals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab 
                ? 'border-sky-600 text-slate-900' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {/* Today's Tasks */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Today&apos;s Tasks
            </h2>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks for today"
                  description="Add one concrete next action so your plan has a visible starting point."
                  action={<button onClick={() => setShowAddTask(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" />Add task</button>}
                />
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg group transition-colors border ${
                      task.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <button onClick={() => toggleTaskStatus(task)}>
                      <span className={`block h-5 w-5 rounded-full border transition-colors ${
                        task.status === 'completed' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.estimated_minutes && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimated_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Overdue */}
            {overdueTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Overdue ({overdueTasks.length})
                </h3>
                {overdueTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg mb-1 border border-red-200">
                    <button onClick={() => toggleTaskStatus(task)}>
                      <span className="block h-4 w-4 rounded-full border border-red-300 bg-white" />
                    </button>
                    <span className="text-sm text-red-600">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Habits */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Daily Habits
            </h2>
            <div className="space-y-2">
              {habits.length === 0 ? (
                <EmptyState
                  title="No habits yet"
                  description="Create a lightweight repeatable action for the behavior you want to make automatic."
                  action={<button onClick={() => setShowAddHabit(true)} className="btn-secondary text-sm">Create habit</button>}
                />
              ) : (
                habits.map(habit => {
                  const isCompleted = completedHabitIds.has(habit.id)
                  return (
                    <div 
                      key={habit.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                        isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                      onClick={() => toggleHabit(habit)}
                    >
                      <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: habit.color }} />
                      <div className="min-w-[56px] rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {isCompleted ? 'Done' : habit.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {habit.name}
                        </p>
                        {habit.current_streak > 0 && (
                          <p className="text-xs text-amber-600">
                            {habit.current_streak} day streak
                          </p>
                        )}
                      </div>
                      {isCompleted && <span className="text-xs font-semibold text-emerald-700">Completed</span>}
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
        <div className="card p-5 animate-slide-up">
          <div className="space-y-2">
            {[...overdueTasks, ...tasks].length === 0 ? (
              <EmptyState
                title="No tasks"
                description="Your task list is clear. Add the next commitment when you are ready to schedule it."
                action={<button onClick={() => setShowAddTask(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" />Add task</button>}
              />
            ) : (
              [...overdueTasks, ...tasks].map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg group border ${
                    task.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 
                    overdueTasks.includes(task) ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <button onClick={() => toggleTaskStatus(task)}>
                    <span className={`block h-5 w-5 rounded-full border transition-colors ${
                      task.status === 'completed' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                    }`} />
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className={`px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span>{task.category}</span>
                      {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === 'habits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {habits.map(habit => (
            <div key={habit.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: habit.color }} />
                <div>
                  <h3 className="font-semibold text-slate-900">{habit.name}</h3>
                  <p className="text-xs text-slate-400">{habit.frequency} · {habit.icon}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-amber-600">
                  <span className="text-sm font-medium">{habit.current_streak} day streak</span>
                </div>
                <span className="text-xs text-slate-400">Best: {habit.best_streak}</span>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="No habits yet"
                description="Start with one small repeatable behavior and let streaks make progress visible."
                action={<button onClick={() => setShowAddHabit(true)} className="btn-secondary text-sm">Create habit</button>}
              />
            </div>
          )}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          {goals.map(goal => (
            <div key={goal.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: goal.color }} />
                <div>
                  <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                  <p className="text-xs text-slate-400">{goal.category}</p>
                </div>
              </div>
              {goal.description && (
                <p className="text-sm text-slate-500 mb-3">{goal.description}</p>
              )}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-900">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
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
                    className={`flex-1 py-1 text-xs rounded transition-colors ${
                      goal.progress >= p ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          ))}
          {goals.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="No goals yet"
                description="Set a goal with a target date so tasks and habits can point somewhere."
                action={<button onClick={() => setShowAddGoal(true)} className="btn-secondary text-sm">Set goal</button>}
              />
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="What do you need to do?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    {TASK_PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {TASK_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={taskForm.estimated_minutes}
                  onChange={(e) => setTaskForm(f => ({ ...f, estimated_minutes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create Habit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g., Morning meditation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Frequency</label>
                <select
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm(f => ({ ...f, frequency: e.target.value as HabitFrequency }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {HABIT_FREQUENCIES.map(frequency => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Marker</label>
                <div className="flex gap-2 flex-wrap">
                  {HABIT_MARKERS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setHabitForm(f => ({ ...f, icon }))}
                      className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                        habitForm.icon === icon ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
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
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Set Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g., Learn Spanish"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                  placeholder="Why is this goal important to you?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    {GOAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm(f => ({ ...f, target_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addGoal}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors border border-sky-600"
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
