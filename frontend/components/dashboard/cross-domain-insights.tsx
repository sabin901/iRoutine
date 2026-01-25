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
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <div className="animate-pulse">Loading insights...</div>
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
      {/* Enhanced Header with Gradient */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 via-purple-200/20 to-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cross-Domain Insights
            </h2>
            <p className="text-base text-neutral-600 font-medium mt-1">
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
                className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-xl card-hover overflow-hidden group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-60`}></div>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">{insight.title}</h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                  
                  {insight.recommendation && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-blue-900 leading-relaxed">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-12 text-center border-2 border-dashed border-neutral-300">
          <Brain className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Insights Yet</h3>
          <p className="text-sm text-neutral-500">Start tracking your activities, energy, and spending to see insights here.</p>
        </div>
      )}

      {/* Time vs Money Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Time vs Spending (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeMoneyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
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
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Energy vs Spending (Last 14 Days)</h3>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
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
        </div>
      ) : (
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl p-12 text-center border-2 border-dashed border-neutral-300">
          <Zap className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-sm text-neutral-500">No energy vs spending data available yet.</p>
        </div>
      )}

      {/* Enhanced Summary Stats */}
      {(timeMoneyData.length > 0 || energySpendingData.length > 0) && (
        <div className="grid gap-6 md:grid-cols-3">
          {timeMoneyData.length > 0 && (
            <>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-xl card-hover overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Avg Daily Hours</div>
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {(
                      timeMoneyData.reduce((sum, d) => sum + d.total_hours, 0) / timeMoneyData.length
                    ).toFixed(1)}h
                  </div>
                </div>
              </div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-xl card-hover overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Avg Daily Expenses</div>
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    $
                    {(
                      timeMoneyData.reduce((sum, d) => sum + d.daily_expenses, 0) / timeMoneyData.length
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </>
          )}
          {energySpendingData.length > 0 && (
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-xl card-hover overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Avg Energy Level</div>
                </div>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {(
                    energySpendingData.reduce((sum, d) => sum + d.energy_level, 0) /
                    energySpendingData.length
                  ).toFixed(1)}
                  <span className="text-2xl text-neutral-500">/5</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
