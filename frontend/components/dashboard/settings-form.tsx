'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/contexts/toast-context'

export function SettingsForm() {
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const toast = useToast()

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
        localStorage.setItem('routine_profile', JSON.stringify({ name, timezone }))
        toast.success('Settings saved')
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

      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
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
      toast.error(err.message || 'Failed to export data')
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
        exportWeeklyPDF(reportData, { onPopupBlocked: () => toast.error('Please allow popups to export PDF') })
        return
      }

      toast.show('PDF export requires data from server. Use CSV export for now.', 'info')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export PDF')
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-slide-up">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="card p-6 animate-slide-up">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
          className="w-full rounded-lg btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Data Export</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExport}
            className="w-full rounded-lg btn-secondary px-4 py-2.5 text-sm font-medium"
          >
            Export Data (CSV)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full rounded-lg btn-primary px-4 py-2.5 text-sm font-medium"
          >
            Export Weekly Report (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}
