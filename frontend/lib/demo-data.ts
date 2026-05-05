import { format, subDays } from 'date-fns'
import type {
  Activity,
  Budget,
  DailyPlan,
  DailyReflection,
  EnergyLog,
  Goal,
  Habit,
  HabitLog,
  Interruption,
  ProductFeedback,
  SavingsGoal,
  Task,
  Transaction,
} from '@/lib/types'

function isoAt(dayOffset: number, hour: number, minute = 0) {
  const date = subDays(new Date(), dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function localDateTimeAt(dayOffset: number, hour: number, minute = 0) {
  const date = subDays(new Date(), dayOffset)
  date.setHours(hour, minute, 0, 0)
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function seedDemoWorkspace() {
  // Keep demo records relative to today so every dashboard section looks current.
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd')
  const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd')

  const activities: Partial<Activity>[] = [
    { id: 'demo-a1', user_id: 'demo-user', category: 'Rest', start_time: isoAt(0, 6, 45), end_time: isoAt(0, 7, 10), note: 'Morning walk and water before screens', work_type: 'rest', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a2', user_id: 'demo-user', category: 'Reading', start_time: isoAt(0, 7, 20), end_time: isoAt(0, 7, 45), note: 'Reviewed goals and wrote the top three outcomes', work_type: 'deep', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a3', user_id: 'demo-user', category: 'Work', start_time: isoAt(0, 8), end_time: isoAt(0, 8, 35), note: 'Inbox triage and calendar cleanup', work_type: 'shallow', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a4', user_id: 'demo-user', category: 'Coding', start_time: isoAt(0, 9), end_time: isoAt(0, 10, 45), note: 'Built onboarding flow and demo-data seeding', work_type: 'deep', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a5', user_id: 'demo-user', category: 'Reading', start_time: isoAt(0, 10, 55), end_time: isoAt(0, 11, 35), note: 'Reviewed product feedback themes and retention notes', work_type: 'deep', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a6', user_id: 'demo-user', category: 'Rest', start_time: isoAt(0, 12, 5), end_time: isoAt(0, 12, 45), note: 'Lunch away from desk', work_type: 'rest', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a7', user_id: 'demo-user', category: 'Work', start_time: isoAt(0, 13), end_time: isoAt(0, 14), note: 'Founder analytics review: activation, feedback, retention', work_type: 'mixed', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a8', user_id: 'demo-user', category: 'Work', start_time: isoAt(0, 14, 20), end_time: isoAt(0, 14, 50), note: 'Support replies and message backlog', work_type: 'shallow', energy_cost: 'heavy', created_at: new Date().toISOString() },
    { id: 'demo-a9', user_id: 'demo-user', category: 'Coding', start_time: isoAt(0, 15, 15), end_time: isoAt(0, 16, 40), note: 'Insights dashboard polish and copy pass', work_type: 'deep', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a10', user_id: 'demo-user', category: 'Rest', start_time: isoAt(0, 17, 20), end_time: isoAt(0, 18), note: 'Workout and reset', work_type: 'rest', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a11', user_id: 'demo-user', category: 'Reading', start_time: isoAt(0, 20, 30), end_time: isoAt(0, 20, 50), note: 'Daily reflection and tomorrow plan', work_type: 'deep', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a12', user_id: 'demo-user', category: 'Work', start_time: isoAt(1, 9, 15), end_time: isoAt(1, 11, 30), note: 'Client project block', work_type: 'mixed', energy_cost: 'heavy', created_at: new Date().toISOString() },
    { id: 'demo-a13', user_id: 'demo-user', category: 'Coding', start_time: isoAt(1, 13, 30), end_time: isoAt(1, 15, 10), note: 'Calendar import endpoint and UI pass', work_type: 'deep', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a14', user_id: 'demo-user', category: 'Rest', start_time: isoAt(1, 17), end_time: isoAt(1, 17, 30), note: 'Walk outside', work_type: 'rest', energy_cost: 'light', created_at: new Date().toISOString() },
    { id: 'demo-a15', user_id: 'demo-user', category: 'Coding', start_time: isoAt(2, 8, 45), end_time: isoAt(2, 10, 15), note: 'Playwright coverage for major flows', work_type: 'deep', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a16', user_id: 'demo-user', category: 'Work', start_time: isoAt(2, 15), end_time: isoAt(2, 16, 10), note: 'Weekly digest export review', work_type: 'mixed', energy_cost: 'medium', created_at: new Date().toISOString() },
    { id: 'demo-a17', user_id: 'demo-user', category: 'Social', start_time: isoAt(3, 18, 10), end_time: isoAt(3, 19, 20), note: 'Dinner with a beta user', work_type: 'rest', energy_cost: 'light', created_at: new Date().toISOString() },
  ]

  const interruptions: Partial<Interruption>[] = [
    { id: 'demo-i1', user_id: 'demo-user', activity_id: null, time: isoAt(0, 8, 18), end_time: isoAt(0, 8, 24), duration_minutes: 6, type: 'Phone', note: 'Bank SMS during inbox triage', created_at: new Date().toISOString() },
    { id: 'demo-i2', user_id: 'demo-user', activity_id: null, time: isoAt(0, 14, 12), end_time: isoAt(0, 14, 29), duration_minutes: 17, type: 'Phone', note: 'Messages during focus transition', created_at: new Date().toISOString() },
    { id: 'demo-i3', user_id: 'demo-user', activity_id: null, time: isoAt(0, 15, 2), end_time: isoAt(0, 15, 12), duration_minutes: 10, type: 'Social Media', note: 'Quick check after support replies', created_at: new Date().toISOString() },
    { id: 'demo-i4', user_id: 'demo-user', activity_id: null, time: isoAt(1, 15, 5), end_time: isoAt(1, 15, 18), duration_minutes: 13, type: 'Social Media', note: 'Quick check became longer', created_at: new Date().toISOString() },
    { id: 'demo-i5', user_id: 'demo-user', activity_id: null, time: isoAt(2, 11, 20), end_time: isoAt(2, 11, 29), duration_minutes: 9, type: 'Noise', note: 'Context switch during test review', created_at: new Date().toISOString() },
  ]

  const plans: DailyPlan[] = [
    {
      id: 'demo-plan-today',
      date: today,
      goals: ['Ship onboarding checklist', 'Review beta feedback', 'Protect two deep work blocks'],
      planned_focus_hours: 6,
      planned_activities: [
        {
          id: 'demo-block-1',
          description: 'Morning plan',
          category: 'Reading',
          planned_start: localDateTimeAt(0, 7, 20),
          planned_end: localDateTimeAt(0, 7, 45),
          priority: 'high',
        },
        {
          id: 'demo-block-2',
          description: 'Deep work: product activation',
          category: 'Coding',
          planned_start: localDateTimeAt(0, 9),
          planned_end: localDateTimeAt(0, 11),
          priority: 'high',
        },
        {
          id: 'demo-block-3',
          description: 'Founder analytics review',
          category: 'Work',
          planned_start: localDateTimeAt(0, 13),
          planned_end: localDateTimeAt(0, 14),
          priority: 'medium',
        },
        {
          id: 'demo-block-4',
          description: 'Insights dashboard polish',
          category: 'Coding',
          planned_start: localDateTimeAt(0, 15),
          planned_end: localDateTimeAt(0, 16, 30),
          priority: 'high',
        },
        {
          id: 'demo-block-5',
          description: 'Daily reflection',
          category: 'Reading',
          planned_start: localDateTimeAt(0, 20, 30),
          planned_end: localDateTimeAt(0, 20, 50),
          priority: 'medium',
        },
      ],
      created_at: new Date().toISOString(),
    },
  ]

  const feedback: ProductFeedback[] = [
    {
      id: 'demo-feedback-1',
      user_id: 'demo-user',
      product_area: 'insights',
      rating: 5,
      message: 'The pattern explanations are useful, but I need a weekly summary to remember them.',
      email: 'beta@example.com',
      created_at: isoAt(1, 18),
    },
    {
      id: 'demo-feedback-2',
      user_id: 'demo-user',
      product_area: 'finances',
      rating: 4,
      message: 'The spending emotion tags made me notice stress purchases I usually ignore.',
      email: 'founder@example.com',
      created_at: isoAt(2, 16),
    },
    {
      id: 'demo-feedback-3',
      user_id: 'demo-user',
      product_area: 'planner',
      rating: 5,
      message: 'Seeing tasks next to energy makes tomorrow planning much easier.',
      email: null,
      created_at: isoAt(3, 19),
    },
  ]

  const transactions: Transaction[] = [
    { id: 'demo-tx-1', user_id: 'demo-user', amount: 4200, type: 'income', category: 'Salary', description: 'Monthly income', date: today, is_recurring: true, recurring_id: null, intent: 'planned', emotion: 'neutral', worth_it: true, created_at: new Date().toISOString() },
    { id: 'demo-tx-2', user_id: 'demo-user', amount: 7.5, type: 'expense', category: 'Food', description: 'Coffee before planning', date: today, is_recurring: false, recurring_id: null, intent: 'planned', emotion: 'joy', worth_it: true, created_at: new Date().toISOString() },
    { id: 'demo-tx-3', user_id: 'demo-user', amount: 46.2, type: 'expense', category: 'Food', description: 'Lunch after focus block', date: today, is_recurring: false, recurring_id: null, intent: 'planned', emotion: 'convenience', worth_it: true, created_at: new Date().toISOString() },
    { id: 'demo-tx-4', user_id: 'demo-user', amount: 18.99, type: 'expense', category: 'Subscriptions', description: 'Unused app renewal', date: today, is_recurring: true, recurring_id: null, intent: 'unplanned', emotion: 'guilt', worth_it: false, created_at: new Date().toISOString() },
    { id: 'demo-tx-5', user_id: 'demo-user', amount: 29, type: 'expense', category: 'Education', description: 'Founder analytics course module', date: today, is_recurring: false, recurring_id: null, intent: 'planned', emotion: 'joy', worth_it: true, created_at: new Date().toISOString() },
    { id: 'demo-tx-6', user_id: 'demo-user', amount: 86.4, type: 'expense', category: 'Food', description: 'Groceries for the week', date: yesterday, is_recurring: false, recurring_id: null, intent: 'planned', emotion: 'necessity', worth_it: true, created_at: new Date().toISOString() },
    { id: 'demo-tx-7', user_id: 'demo-user', amount: 72.5, type: 'expense', category: 'Transport', description: 'Rideshare after late meeting', date: yesterday, is_recurring: false, recurring_id: null, intent: 'unplanned', emotion: 'stress', worth_it: false, created_at: new Date().toISOString() },
    { id: 'demo-tx-8', user_id: 'demo-user', amount: 16.99, type: 'expense', category: 'Education', description: 'Product strategy book', date: twoDaysAgo, is_recurring: false, recurring_id: null, intent: 'planned', emotion: 'joy', worth_it: true, created_at: new Date().toISOString() },
  ]

  const month = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  const budgets: Budget[] = [
    { id: 'demo-budget-1', user_id: 'demo-user', category: 'Food', amount: 500, month, created_at: new Date().toISOString() },
    { id: 'demo-budget-2', user_id: 'demo-user', category: 'Transport', amount: 250, month, created_at: new Date().toISOString() },
    { id: 'demo-budget-3', user_id: 'demo-user', category: 'Subscriptions', amount: 80, month, created_at: new Date().toISOString() },
    { id: 'demo-budget-4', user_id: 'demo-user', category: 'Education', amount: 120, month, created_at: new Date().toISOString() },
  ]

  const savingsGoals: SavingsGoal[] = [
    { id: 'demo-sg-1', user_id: 'demo-user', name: 'Emergency fund', description: 'Three months of safety', target_amount: 6000, current_amount: 2450, deadline: format(subDays(new Date(), -120), 'yyyy-MM-dd'), color: '#0ea5e9', status: 'active', created_at: new Date().toISOString() },
    { id: 'demo-sg-2', user_id: 'demo-user', name: 'Launch laptop', description: 'Hardware for client work', target_amount: 2200, current_amount: 1680, deadline: format(subDays(new Date(), -60), 'yyyy-MM-dd'), color: '#10b981', status: 'active', created_at: new Date().toISOString() },
    { id: 'demo-sg-3', user_id: 'demo-user', name: 'YC application buffer', description: 'Travel, prototypes, and interview prep', target_amount: 1500, current_amount: 900, deadline: format(subDays(new Date(), -75), 'yyyy-MM-dd'), color: '#f59e0b', status: 'active', created_at: new Date().toISOString() },
  ]

  const tasks: Task[] = [
    { id: 'demo-task-1', user_id: 'demo-user', title: 'Ship activation checklist', description: 'Make first-run dashboard useful', due_date: today, due_time: null, priority: 'high', status: 'completed', category: 'Work', estimated_minutes: 90, actual_minutes: 75, completed_at: isoAt(0, 10, 45), is_recurring: false, recurring_pattern: null, energy_required: 'medium', avoidance_count: 0, last_postponed_at: null, breakdown_suggested: false, created_at: new Date().toISOString() },
    { id: 'demo-task-2', user_id: 'demo-user', title: 'Review weekly spending drift', description: 'Look for stress purchases', due_date: today, due_time: null, priority: 'medium', status: 'pending', category: 'Financial', estimated_minutes: 30, actual_minutes: null, completed_at: null, is_recurring: false, recurring_pattern: null, energy_required: 'light', avoidance_count: 1, last_postponed_at: isoAt(1, 18), breakdown_suggested: false, created_at: new Date().toISOString() },
    { id: 'demo-task-3', user_id: 'demo-user', title: 'Plan tomorrow deep work', description: 'Block calendar before messages start', due_date: today, due_time: null, priority: 'urgent', status: 'pending', category: 'Work', estimated_minutes: 20, actual_minutes: null, completed_at: null, is_recurring: false, recurring_pattern: null, energy_required: 'light', avoidance_count: 0, last_postponed_at: null, breakdown_suggested: false, created_at: new Date().toISOString() },
    { id: 'demo-task-4', user_id: 'demo-user', title: 'Send weekly digest to beta list', description: 'Export the weekly digest and send it to two testers', due_date: today, due_time: '16:30', priority: 'high', status: 'in_progress', category: 'Work', estimated_minutes: 45, actual_minutes: 25, completed_at: null, is_recurring: false, recurring_pattern: null, energy_required: 'medium', avoidance_count: 0, last_postponed_at: null, breakdown_suggested: false, created_at: new Date().toISOString() },
    { id: 'demo-task-5', user_id: 'demo-user', title: 'Cancel unused subscription', description: 'Remove the app renewal flagged by finance insight', due_date: today, due_time: '18:30', priority: 'medium', status: 'pending', category: 'Financial', estimated_minutes: 10, actual_minutes: null, completed_at: null, is_recurring: false, recurring_pattern: null, energy_required: 'light', avoidance_count: 0, last_postponed_at: null, breakdown_suggested: false, created_at: new Date().toISOString() },
    { id: 'demo-task-6', user_id: 'demo-user', title: 'Thirty-minute workout', description: 'Use the reset block before evening planning', due_date: today, due_time: '17:20', priority: 'medium', status: 'completed', category: 'Health', estimated_minutes: 40, actual_minutes: 40, completed_at: isoAt(0, 18), is_recurring: true, recurring_pattern: 'weekdays', energy_required: 'medium', avoidance_count: 0, last_postponed_at: null, breakdown_suggested: false, created_at: new Date().toISOString() },
  ]

  const goals: Goal[] = [
    { id: 'demo-goal-1', user_id: 'demo-user', title: 'Launch a useful beta', description: 'Get 10 people to reach activation and give feedback', category: 'Career', target_date: format(subDays(new Date(), -45), 'yyyy-MM-dd'), status: 'active', progress: 62, milestones: [{ id: 'm1', title: 'Activation flow', completed: true }, { id: 'm2', title: 'Weekly digest', completed: true }, { id: 'm3', title: 'User interviews', completed: false }], color: '#0ea5e9', created_at: new Date().toISOString() },
    { id: 'demo-goal-2', user_id: 'demo-user', title: 'Stabilize personal finances', description: 'Reduce unplanned purchases and build emergency fund', category: 'Financial', target_date: format(subDays(new Date(), -90), 'yyyy-MM-dd'), status: 'active', progress: 41, milestones: [], color: '#10b981', created_at: new Date().toISOString() },
    { id: 'demo-goal-3', user_id: 'demo-user', title: 'Build a sustainable founder routine', description: 'Protect deep work, workouts, and weekly reflection', category: 'Health', target_date: format(subDays(new Date(), -60), 'yyyy-MM-dd'), status: 'active', progress: 55, milestones: [{ id: 'm4', title: 'Morning plan streak', completed: true }, { id: 'm5', title: 'Two protected blocks per weekday', completed: false }, { id: 'm6', title: 'Weekly review habit', completed: true }], color: '#f59e0b', created_at: new Date().toISOString() },
  ]

  const habits: Habit[] = [
    { id: 'demo-habit-1', user_id: 'demo-user', name: 'Morning plan', description: 'Write top three outcomes', frequency: 'daily', target_count: 1, color: '#0ea5e9', icon: 'M', is_active: true, current_streak: 5, best_streak: 11, created_at: new Date().toISOString() },
    { id: 'demo-habit-2', user_id: 'demo-user', name: 'No phone deep work', description: 'One protected block', frequency: 'weekdays', target_count: 1, color: '#f59e0b', icon: 'F', is_active: true, current_streak: 3, best_streak: 8, created_at: new Date().toISOString() },
    { id: 'demo-habit-3', user_id: 'demo-user', name: 'Expense check', description: 'Review unplanned spending before dinner', frequency: 'daily', target_count: 1, color: '#10b981', icon: '$', is_active: true, current_streak: 2, best_streak: 6, created_at: new Date().toISOString() },
    { id: 'demo-habit-4', user_id: 'demo-user', name: 'Evening reflection', description: 'Write what worked and one adjustment', frequency: 'daily', target_count: 1, color: '#8b5cf6', icon: 'R', is_active: true, current_streak: 4, best_streak: 9, created_at: new Date().toISOString() },
  ]

  const habitLogs: HabitLog[] = [
    { id: 'demo-habit-log-1', habit_id: 'demo-habit-1', user_id: 'demo-user', date: today, completed: true, count: 1, note: null, created_at: new Date().toISOString() },
    { id: 'demo-habit-log-2', habit_id: 'demo-habit-2', user_id: 'demo-user', date: today, completed: true, count: 1, note: 'Phone was away for the morning block', created_at: new Date().toISOString() },
    { id: 'demo-habit-log-3', habit_id: 'demo-habit-3', user_id: 'demo-user', date: today, completed: false, count: 0, note: 'Do after dinner', created_at: new Date().toISOString() },
    { id: 'demo-habit-log-4', habit_id: 'demo-habit-4', user_id: 'demo-user', date: yesterday, completed: true, count: 1, note: null, created_at: new Date().toISOString() },
    { id: 'demo-habit-log-5', habit_id: 'demo-habit-1', user_id: 'demo-user', date: yesterday, completed: true, count: 1, note: null, created_at: new Date().toISOString() },
    { id: 'demo-habit-log-6', habit_id: 'demo-habit-2', user_id: 'demo-user', date: twoDaysAgo, completed: true, count: 1, note: null, created_at: new Date().toISOString() },
  ]

  const energyLogs: EnergyLog[] = [
    { id: 'demo-energy-1', user_id: 'demo-user', date: today, energy_level: 4, stress_level: 2, mood: 'focused', sleep_hours: 7.5, note: 'Best focus before lunch', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'demo-energy-2', user_id: 'demo-user', date: yesterday, energy_level: 3, stress_level: 3, mood: 'neutral', sleep_hours: 6.8, note: 'Energy dipped after a late meeting', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'demo-energy-3', user_id: 'demo-user', date: twoDaysAgo, energy_level: 5, stress_level: 1, mood: 'happy', sleep_hours: 8.1, note: 'Protected morning and fewer messages', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'demo-energy-4', user_id: 'demo-user', date: threeDaysAgo, energy_level: 3, stress_level: 4, mood: 'stressed', sleep_hours: 6.2, note: 'Too many context switches in the afternoon', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]

  const reflections: DailyReflection[] = [
    {
      id: 'demo-reflection-1',
      user_id: 'demo-user',
      date: today,
      what_worked: 'Morning planning plus the 9-11:35 focus stretch produced the highest quality work of the day.',
      what_didnt: 'Messages still interrupted the afternoon block and overlapped with avoidable spending.',
      why: 'The phone stayed nearby after lunch, right when energy naturally dropped.',
      adjustment: 'Put the phone in another room before the second focus block and batch support replies at 1 PM.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  localStorage.setItem('routine_activities', JSON.stringify(activities))
  localStorage.setItem('routine_interruptions', JSON.stringify(interruptions))
  localStorage.setItem('routine_daily_plans', JSON.stringify(plans))
  localStorage.setItem('routine_product_feedback', JSON.stringify(feedback))
  localStorage.setItem('routine_transactions', JSON.stringify(transactions))
  localStorage.setItem('routine_budgets', JSON.stringify(budgets))
  localStorage.setItem('routine_savings_goals', JSON.stringify(savingsGoals))
  localStorage.setItem('routine_tasks', JSON.stringify(tasks))
  localStorage.setItem('routine_goals', JSON.stringify(goals))
  localStorage.setItem('routine_habits', JSON.stringify(habits))
  localStorage.setItem('routine_habit_logs', JSON.stringify(habitLogs))
  localStorage.setItem('routine_energy_logs', JSON.stringify(energyLogs))
  localStorage.setItem('routine_daily_reflections', JSON.stringify(reflections))
  localStorage.setItem('routine_profile', JSON.stringify({ name: 'Demo User', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }))
  localStorage.setItem('routine_demo_seeded_version', '3')
}

export function ensureDemoWorkspaceSeeded() {
  if (typeof window === 'undefined') return

  // Reseed when any required collection is missing or the sample schema changes.
  const requiredCollections = [
    'routine_activities',
    'routine_interruptions',
    'routine_daily_plans',
    'routine_transactions',
    'routine_budgets',
    'routine_savings_goals',
    'routine_tasks',
    'routine_goals',
    'routine_habits',
    'routine_habit_logs',
    'routine_energy_logs',
    'routine_daily_reflections',
  ]

  const hasCompleteDemo = requiredCollections.every(key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(value) && value.length > 0
    } catch {
      return false
    }
  })

  if (!hasCompleteDemo || localStorage.getItem('routine_demo_seeded_version') !== '3') {
    seedDemoWorkspace()
  }
}

export function getActivationState() {
  if (typeof window === 'undefined') {
    const steps = [
      { id: 'plan', label: 'Create a daily plan', done: false },
      { id: 'activity', label: 'Log at least 3 activities', done: false },
      { id: 'interruption', label: 'Log one interruption', done: false },
      { id: 'feedback', label: 'Leave beta feedback', done: false },
    ]

    return {
      activities: [],
      interruptions: [],
      plans: [],
      feedback: [],
      steps,
      completed: 0,
      total: steps.length,
    }
  }

  const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
  const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
  const plans = JSON.parse(localStorage.getItem('routine_daily_plans') || '[]')
  const feedback = JSON.parse(localStorage.getItem('routine_product_feedback') || '[]')

  // These are the first actions a new user must take before the product feels useful.
  const steps = [
    { id: 'plan', label: 'Create a daily plan', done: plans.length > 0 },
    { id: 'activity', label: 'Log at least 3 activities', done: activities.length >= 3 },
    { id: 'interruption', label: 'Log one interruption', done: interruptions.length >= 1 },
    { id: 'feedback', label: 'Leave beta feedback', done: feedback.length >= 1 },
  ]

  return {
    activities,
    interruptions,
    plans,
    feedback,
    steps,
    completed: steps.filter(step => step.done).length,
    total: steps.length,
  }
}
