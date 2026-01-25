export type ActivityCategory =
  | 'Study'
  | 'Coding'
  | 'Work'
  | 'Reading'
  | 'Rest'
  | 'Social'
  | 'Other'

export type InterruptionType =
  | 'Phone'
  | 'Social Media'
  | 'Noise'
  | 'Other'

export type EnergyCost = 'light' | 'medium' | 'heavy'
export type WorkType = 'deep' | 'shallow' | 'mixed' | 'rest'
export type TransactionIntent = 'planned' | 'unplanned' | 'impulse'
export type TransactionEmotion = 'joy' | 'convenience' | 'stress' | 'necessity' | 'guilt' | 'neutral' | 'other'
export type Mood = 'excited' | 'happy' | 'neutral' | 'tired' | 'stressed' | 'anxious' | 'calm' | 'focused' | 'other'

export interface Activity {
  id: string
  user_id: string
  category: ActivityCategory
  start_time: string
  end_time: string
  note: string | null
  energy_cost: EnergyCost | null
  work_type: WorkType | null
  planned_start_time: string | null
  planned_end_time: string | null
  task_id: string | null
  created_at: string
}

export interface Interruption {
  id: string
  user_id: string
  activity_id: string | null
  time: string
  end_time?: string // Optional: when interruption ended (for duration tracking)
  duration_minutes?: number // Duration in minutes (calculated or set)
  type: InterruptionType
  note: string | null
  created_at: string
}

export interface Profile {
  id: string
  name: string
  timezone: string
  created_at: string
}

export interface Insight {
  peak_focus_window: string
  distraction_hotspot: string
  consistency_score: number
  balance_ratio: number
  suggestion: string
}

export interface PlannedActivity {
  id: string
  description: string
  category: ActivityCategory
  planned_start: string
  planned_end: string
  priority: 'high' | 'medium' | 'low'
}

export interface DailyPlan {
  id: string
  date: string // YYYY-MM-DD
  goals: string[]
  planned_focus_hours: number
  planned_activities: PlannedActivity[]
  created_at: string
}

export interface DailyReview {
  id: string
  plan_id: string
  goals_met: 'yes' | 'partial' | 'no'
  actual_focus_hours: number
  reflection: string | null
  created_at: string
}

// =============================================
// FINANCES TYPES
// =============================================

export type TransactionType = 'income' | 'expense'

export type ExpenseCategory = 
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Education'
  | 'Rent'
  | 'Utilities'
  | 'Subscriptions'
  | 'Other'

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Gift'
  | 'Refund'
  | 'Other'

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category: string
  description: string | null
  date: string
  is_recurring: boolean
  recurring_id: string | null
  intent: TransactionIntent | null
  emotion: TransactionEmotion | null
  worth_it: boolean | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  amount: number
  month: string
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
}

export interface RecurringTransaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category: string
  description: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  start_date: string
  next_date: string
  is_active: boolean
  created_at: string
}

export interface FinancialSummary {
  month: string
  total_income: number
  total_expenses: number
  net_savings: number
  expense_by_category: Record<string, number>
  income_by_category: Record<string, number>
  budget_status: {
    category: string
    budget: number
    spent: number
    remaining: number
    percentage: number
  }[]
  transaction_count: number
}

// =============================================
// PLANNER TYPES
// =============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type GoalCategory = 'Career' | 'Health' | 'Learning' | 'Financial' | 'Personal' | 'Relationships' | 'Other'
export type HabitFrequency = 'daily' | 'weekdays' | 'weekly'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: TaskPriority
  status: TaskStatus
  category: string
  estimated_minutes: number | null
  actual_minutes: number | null
  completed_at: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  energy_required: EnergyCost | null
  avoidance_count: number
  last_postponed_at: string | null
  breakdown_suggested: boolean
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: GoalCategory
  target_date: string | null
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  progress: number
  milestones: { id: string; title: string; completed: boolean }[]
  color: string
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  target_count: number
  color: string
  icon: string
  is_active: boolean
  current_streak: number
  best_streak: number
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  date: string
  completed: boolean
  count: number
  note: string | null
  created_at: string
}

export interface TodaySummary {
  date: string
  tasks: Task[]
  overdue_tasks: Task[]
  habits: Habit[]
  habit_logs: HabitLog[]
  goals: Goal[]
  stats: {
    tasks_completed: number
    tasks_total: number
    tasks_completion_rate: number
    habits_completed: number
    habits_total: number
    habits_completion_rate: number
    overdue_count: number
  }
}

// =============================================
// ENERGY & MOOD TYPES
// =============================================

export interface EnergyLog {
  id: string
  user_id: string
  date: string
  energy_level: number // 1-5
  stress_level: number // 1-5
  mood: Mood | null
  sleep_hours: number | null
  note: string | null
  created_at: string
  updated_at: string
}

// =============================================
// REFLECTIONS TYPES
// =============================================

export interface DailyReflection {
  id: string
  user_id: string
  date: string
  what_worked: string | null
  what_didnt: string | null
  why: string | null
  adjustment: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyReflection {
  id: string
  user_id: string
  week_start: string
  time_vs_plan: string | null
  money_vs_budget: string | null
  energy_vs_workload: string | null
  adjustment: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyReflection {
  id: string
  user_id: string
  month: string
  trends: string | null
  stability: string | null
  burnout_signals: string | null
  financial_safety_progress: string | null
  created_at: string
  updated_at: string
}

// =============================================
// CROSS-DOMAIN ANALYTICS TYPES
// =============================================

export interface TimeMoneyCorrelation {
  date: string
  activity_count: number
  total_hours: number
  interruption_count: number
  daily_expenses: number
  daily_income: number
  correlation_score?: number | null
}

export interface EnergySpendingCorrelation {
  date: string
  energy_level: number
  stress_level: number
  daily_expenses: number
  expense_count: number
  correlation_score?: number | null
}

export interface InterruptionTaskCorrelation {
  task_date: string
  total_tasks: number
  completed_tasks: number
  interruption_count: number
  completion_rate: number
  correlation_score?: number | null
}

export interface CrossDomainInsight {
  type: string
  title: string
  description: string
  data: Record<string, any>
  recommendation?: string | null
}
