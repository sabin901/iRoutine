'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api'

export function SettingsForm() {
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Check if using placeholder Supabase (demo mode)
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        // Load from localStorage
        const profile = JSON.parse(localStorage.getItem('routine_profile') || '{}')
        setName(profile.name || 'Demo User')
        setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setName(data.name || '')
        setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Check if using placeholder Supabase (demo mode)
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        // Save to localStorage
        localStorage.setItem('routine_profile', JSON.stringify({ name, timezone }))
        alert('Settings saved')
        setSaving(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          timezone,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Settings saved')
    } catch (err: any) {
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      // Check if using placeholder Supabase (demo mode)
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        // Export from localStorage
        const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        
        // Create CSV
        let csv = 'Type,Category/Type,Start Time,End Time,Duration (min),Note\n'
        activities.forEach((a: any) => {
          const duration = a.end_time && a.start_time 
            ? Math.round((new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 1000 / 60)
            : ''
          csv += `Activity,${a.category},${a.start_time},${a.end_time},${duration},"${(a.note || '').replace(/"/g, '""')}"\n`
        })
        interruptions.forEach((i: any) => {
          csv += `Interruption,${i.type},${i.time},${i.end_time || ''},${i.duration_minutes || ''},"${(i.note || '').replace(/"/g, '""')}"\n`
        })
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `routine-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      const data = await apiRequest<{ url: string }>('/api/export')
      window.open(data.url, '_blank')
    } catch (err: any) {
      alert(err.message || 'Failed to export data')
    }
  }

  const handleExportPDF = async () => {
    try {
      const { exportWeeklyPDF, generateWeeklyReportData } = await import('@/lib/pdf-export')
      
      // Check if using placeholder Supabase (demo mode)
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      
      if (isPlaceholder) {
        const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        
        const reportData = generateWeeklyReportData(activities, interruptions)
        exportWeeklyPDF(reportData)
        return
      }

      // For real Supabase, would fetch from API
      alert('PDF export requires data from server. Please use CSV export for now.')
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF')
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h2 className="text-lg font-medium mb-6">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          >
            {Intl.supportedValuesOf('timeZone').map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Data Export</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Export Data (CSV)
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Export Weekly Report (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}
