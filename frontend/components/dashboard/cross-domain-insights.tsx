'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, AlertCircle, Sparkles, Brain, CheckCircle2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'
import { TimeMoneyCorrelation, EnergySpendingCorrelation, CrossDomainInsight } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export function CrossDomainInsights() {
  const [timeMoneyData, setTimeMoneyData] = useState<TimeMoneyCorrelation[]>([])
  const [energySpendingData, setEnergySpendingData] = useState<EnergySpendingCorrelation[]>([])
  const [insights, setInsights] = useState<CrossDomainInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  /**
   * Load all cross-domain data in parallel for better performance
   * Uses Promise.all to fetch all endpoints simultaneously
   */
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

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
      {/* Header - Dark Artoo style */}
      <div className="rounded-xl card p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <Brain className="h-6 w-6 text-slate-600" />
          </div>
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
            const iconConfig = {
              energy_spending: { icon: DollarSign, gradient: 'from-orange-400 via-red-500 to-pink-500', bg: 'from-orange-50 to-pink-50' },
              focus_quality: { icon: Zap, gradient: 'from-yellow-400 via-amber-500 to-orange-500', bg: 'from-yellow-50 to-orange-50' },
              task_completion: { icon: AlertCircle, gradient: 'from-blue-400 via-indigo-500 to-purple-500', bg: 'from-blue-50 to-purple-50' },
            }
            const config = iconConfig[insight.type as keyof typeof iconConfig] || iconConfig.focus_quality
            const Icon = config.icon
            
            return (
              <div
                key={idx}
                className="rounded-xl card p-6 card-hover"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl bg-slate-100 border border-slate-200`}>
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{insight.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
                
                {insight.recommendation && (
                  <div className="mt-4 p-4 bg-slate-100/50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
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
          <Brain className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
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
