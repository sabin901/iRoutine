'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface CategoryData {
  category: string
  total_minutes: number
  session_count: number
  avg_duration: number
  percentage: number
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function CategoryBreakdown() {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        // Calculate from localStorage
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const categoryData: Record<string, { total: number; count: number }> = {}
        
        storedActivities.forEach((a: any) => {
          const category = a.category
          const start = new Date(a.start_time)
          const end = new Date(a.end_time)
          const duration = (end.getTime() - start.getTime()) / 1000 / 60
          
          if (!categoryData[category]) {
            categoryData[category] = { total: 0, count: 0 }
          }
          categoryData[category].total += duration
          categoryData[category].count += 1
        })
        
        const total = Object.values(categoryData).reduce((sum, d) => sum + d.total, 0)
        
        const breakdown: CategoryData[] = Object.entries(categoryData).map(([category, data]) => ({
          category,
          total_minutes: Math.round(data.total),
          session_count: data.count,
          avg_duration: Math.round(data.total / data.count),
          percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
        }))
        
        setData(breakdown.sort((a, b) => b.total_minutes - a.total_minutes))
        return
      }

      const breakdown = await apiRequest<CategoryData[]>('/api/analytics/category-breakdown?days=30')
      setData(breakdown)
    } catch (err) {
      console.error('Error loading category breakdown:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
          <div className="h-64 bg-neutral-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft">
        <div className="text-center py-12">
          <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">No category data yet</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item, idx) => ({
    name: item.category,
    value: item.total_minutes,
    percentage: item.percentage,
    color: COLORS[idx % COLORS.length],
  }))

  return (
    <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/95 p-6 shadow-soft card-hover">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Category Breakdown</h2>
        <p className="mt-1 text-sm text-neutral-400">Time distribution by activity category</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${Math.round(value)} minutes`, 'Time']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* List */}
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-white">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {Math.round(item.total_minutes / 60 * 10) / 10}h
                  </div>
                  <div className="text-xs text-neutral-400">{item.percentage}%</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: COLORS[idx % COLORS.length]
                  }}
                />
              </div>
              <div className="text-xs text-neutral-400">
                {item.session_count} sessions • {item.avg_duration} min avg
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
