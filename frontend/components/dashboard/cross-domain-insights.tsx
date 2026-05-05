'use client'

import { useState, useEffect } from 'react'
import { Activity, DollarSign, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'
import { ensureDemoWorkspaceSeeded } from '@/lib/demo-data'
import { Activity as RoutineActivity, CrossDomainInsight, EnergyLog, EnergySpendingCorrelation, TimeMoneyCorrelation, Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function activityHours(activity: RoutineActivity) {
  const start = new Date(activity.start_time).getTime()
  const end = new Date(activity.end_time).getTime()
  return Math.max((end - start) / 3600000, 0)
}

function buildDemoCrossDomainData() {
  ensureDemoWorkspaceSeeded()
  const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]') as RoutineActivity[]
  const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]') as { time: string }[]
  const transactions = JSON.parse(localStorage.getItem('routine_transactions') || '[]') as Transaction[]
  const energyLogs = JSON.parse(localStorage.getItem('routine_energy_logs') || '[]') as EnergyLog[]
  const days = Array.from(new Set([
    ...activities.map(activity => dateKey(activity.start_time)),
    ...transactions.map(transaction => transaction.date),
    ...energyLogs.map(log => log.date),
  ])).sort()

  const timeMoneyData: TimeMoneyCorrelation[] = days.map(day => {
    const dayActivities = activities.filter(activity => dateKey(activity.start_time) === day)
    const dayTransactions = transactions.filter(transaction => transaction.date === day)
    const dayInterruptions = interruptions.filter(interruption => dateKey(interruption.time) === day)

    return {
      date: day,
      activity_count: dayActivities.length,
      total_hours: Number(dayActivities.reduce((total, activity) => total + activityHours(activity), 0).toFixed(2)),
      interruption_count: dayInterruptions.length,
      daily_expenses: Number(dayTransactions.filter(transaction => transaction.type === 'expense').reduce((total, transaction) => total + transaction.amount, 0).toFixed(2)),
      daily_income: Number(dayTransactions.filter(transaction => transaction.type === 'income').reduce((total, transaction) => total + transaction.amount, 0).toFixed(2)),
      correlation_score: dayInterruptions.length ? 0.68 : 0.82,
    }
  })

  const energySpendingData: EnergySpendingCorrelation[] = energyLogs.map(log => {
    const dayTransactions = transactions.filter(transaction => transaction.date === log.date && transaction.type === 'expense')
    return {
      date: log.date,
      energy_level: log.energy_level,
      stress_level: log.stress_level,
      daily_expenses: Number(dayTransactions.reduce((total, transaction) => total + transaction.amount, 0).toFixed(2)),
      expense_count: dayTransactions.length,
      correlation_score: log.stress_level >= 3 ? 0.71 : 0.44,
    }
  }).sort((a, b) => a.date.localeCompare(b.date))

  const insights: CrossDomainInsight[] = [
    {
      type: 'focus_quality',
      title: 'Morning focus is your highest-leverage asset',
      description: 'Your best work clusters before lunch, especially when planning happens before inbox triage.',
      data: { window: '9:00 AM - 11:35 AM', focus_hours: 2.58 },
      recommendation: 'Protect this window for building, analytics, or writing. Do admin after the first deep block.',
    },
    {
      type: 'energy_spending',
      title: 'Stress and spending overlap in the afternoon',
      description: 'The 2-4 PM window combines interruptions, heavier energy cost, and the spending that felt least worth it.',
      data: { window: '2:00 PM - 4:00 PM', flagged_spend: 91.49 },
      recommendation: 'Batch messages at 1 PM and review spending before dinner while the pattern is still visible.',
    },
    {
      type: 'task_completion',
      title: 'Activation work is moving, retention is next',
      description: 'The sample workspace shows activation completed, digest work in progress, and feedback pointing to weekly retention loops.',
      data: { activation: 100, feedback_items: 3 },
      recommendation: 'Keep the first-run checklist, then make the weekly digest the next habit-forming loop.',
    },
  ]

  return { timeMoneyData, energySpendingData, insights }
}

export function CrossDomainInsights() {
  const [timeMoneyData, setTimeMoneyData] = useState<TimeMoneyCorrelation[]>([])
  const [energySpendingData, setEnergySpendingData] = useState<EnergySpendingCorrelation[]>([])
  const [insights, setInsights] = useState<CrossDomainInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  useEffect(() => {
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load all cross-domain data in parallel for better performance
   * Uses Promise.all to fetch all endpoints simultaneously
   */
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

      if (isPlaceholder) {
        const demo = buildDemoCrossDomainData()
        setTimeMoneyData(demo.timeMoneyData)
        setEnergySpendingData(demo.energySpendingData)
        setInsights(demo.insights)
        return
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const headers = { 'Authorization': `Bearer ${session.access_token}` }
      
      // Load all data in parallel for better performance
      const [timeMoneyRes, energySpendingRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/api/cross-domain/time-money?days=30`, { headers }),
        fetch(`${API_URL}/api/cross-domain/energy-spending?days=30`, { headers }),
        fetch(`${API_URL}/api/cross-domain/insights?days=30`, { headers }),
      ])

      // Process responses
      const results = await Promise.all([
        timeMoneyRes.ok ? timeMoneyRes.json().catch(() => []) : [],
        energySpendingRes.ok ? energySpendingRes.json().catch(() => []) : [],
        insightsRes.ok ? insightsRes.json().catch(() => []) : [],
      ])

      setTimeMoneyData(results[0] || [])
      setEnergySpendingData(results[1] || [])
      setInsights(results[2] || [])
    } catch (error) {
      console.error('Error loading cross-domain data:', error)
      setError('Failed to load insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl card p-6 animate-pulse">
        <div className="text-slate-500">Loading insights...</div>
      </div>
    )
  }

  // Format data for charts
  const timeMoneyChartData = timeMoneyData.slice(-14).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: item.total_hours,
    expenses: item.daily_expenses,
    interruptions: item.interruption_count,
  }))

  const energySpendingChartData = energySpendingData.slice(-14).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    energy: item.energy_level,
    expenses: item.daily_expenses,
    stress: item.stress_level,
  }))

  return (
    <div className="relative space-y-8">
      <div className="rounded-xl card p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 rounded-full bg-slate-700" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Cross-Domain Insights
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Discover how time, money, energy, and focus interconnect
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Insights Cards */}
      {insights.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, idx) => {
            const accentConfig = {
              energy_spending: 'bg-amber-500',
              focus_quality: 'bg-emerald-500',
              task_completion: 'bg-sky-500',
            }
            const accent = accentConfig[insight.type as keyof typeof accentConfig] || accentConfig.focus_quality
            
            return (
              <div
                key={idx}
                className="rounded-xl card p-6 card-hover"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`mt-2 h-1.5 w-10 rounded-full ${accent}`} aria-hidden="true" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{insight.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
                
                {insight.recommendation && (
                  <div className="mt-4 p-4 bg-slate-100/50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-6 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl card p-12 text-center border-dashed">
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Insights Yet</h3>
          <p className="text-sm text-slate-500">Start tracking your activities, energy, and spending to see insights here.</p>
        </div>
      )}

      {/* Time vs Money Chart */}
      <div className="rounded-xl card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Time vs Spending (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeMoneyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="date" stroke="#a3a3a3" fontSize={12} tick={{ fill: '#a3a3a3' }} />
            <YAxis yAxisId="left" stroke="#a3a3a3" fontSize={12} tick={{ fill: '#a3a3a3' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#a3a3a3" fontSize={12} tick={{ fill: '#a3a3a3' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#262626',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hours"
              stroke="#6172f3"
              strokeWidth={2}
              name="Hours Worked"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              name="Daily Expenses ($)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Energy vs Spending Chart */}
      {energySpendingChartData.length > 0 ? (
        <div className="rounded-xl card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <Zap className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Energy vs Spending (Last 14 Days)</h3>
          </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={energySpendingChartData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="colorExpensesBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#a3a3a3" 
                  fontSize={12}
                  tick={{ fill: '#a3a3a3' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#10b981" 
                  fontSize={12}
                  tick={{ fill: '#10b981' }}
                  domain={[0, 5]}
                  label={{ value: 'Energy Level', angle: -90, position: 'insideLeft', fill: '#10b981' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#ef4444" 
                  fontSize={12}
                  tick={{ fill: '#ef4444' }}
                  label={{ value: 'Expenses ($)', angle: 90, position: 'insideRight', fill: '#ef4444' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#262626',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #404040',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  yAxisId="left" 
                  dataKey="energy" 
                  fill="url(#colorEnergy)" 
                  name="Energy Level"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="expenses" 
                  fill="url(#colorExpensesBar)" 
                  name="Expenses ($)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl card p-12 text-center border-dashed">
          <Zap className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500">No energy vs spending data available yet.</p>
        </div>
      )}

      {/* Enhanced Summary Stats */}
      {(timeMoneyData.length > 0 || energySpendingData.length > 0) && (
        <div className="grid gap-6 md:grid-cols-3">
          {timeMoneyData.length > 0 && (
            <>
              <div className="rounded-xl card p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                    <Activity className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Avg Daily Hours</div>
                </div>
                <div className="text-4xl font-extrabold text-slate-900">
                  {(
                    timeMoneyData.reduce((sum, d) => sum + d.total_hours, 0) / timeMoneyData.length
                  ).toFixed(1)}h
                </div>
              </div>
              <div className="rounded-xl card p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                    <DollarSign className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Avg Daily Expenses</div>
                </div>
                <div className="text-4xl font-extrabold text-slate-900">
                  $
                  {(
                    timeMoneyData.reduce((sum, d) => sum + d.daily_expenses, 0) / timeMoneyData.length
                  ).toFixed(2)}
                </div>
              </div>
            </>
          )}
          {energySpendingData.length > 0 && (
            <div className="rounded-xl card p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <Zap className="h-5 w-5 text-slate-600" />
                </div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Avg Energy Level</div>
              </div>
              <div className="text-4xl font-extrabold text-slate-900">
                {(
                  energySpendingData.reduce((sum, d) => sum + d.energy_level, 0) /
                  energySpendingData.length
                ).toFixed(1)}
                <span className="text-2xl text-slate-500">/5</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
