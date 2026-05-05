'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/contexts/toast-context'
import { Download, FileText, Globe2, ShieldCheck, UserRound } from 'lucide-react'
import { isDemoMode } from '@/lib/env'
import { getErrorMessage } from '@/lib/errors'

export function SettingsForm() {
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const toast = useToast()
  const demoMode = isDemoMode()
  useEffect(() => {
    loadProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      // Check if using placeholder Supabase (demo mode)
      if (demoMode) {
        // Load from localStorage
        const profile = JSON.parse(localStorage.getItem('routine_profile') || '{}')
        setName(profile.name || 'Demo User')
        setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
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
      if (demoMode) {
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      // Check if using placeholder Supabase (demo mode)
      if (demoMode) {
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to export data'))
    }
  }

  const handleExportPDF = async () => {
    try {
      const { exportWeeklyPDF, generateWeeklyReportData } = await import('@/lib/pdf-export')
      
      // Check if using placeholder Supabase (demo mode)
      if (demoMode) {
        const activities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const interruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        const reportData = generateWeeklyReportData(activities, interruptions)
        exportWeeklyPDF(reportData, { onPopupBlocked: () => toast.error('Please allow popups to export PDF') })
        return
      }

      toast.show('PDF export requires data from server. Use CSV export for now.', 'info')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to export PDF'))
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
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="card p-6 animate-slide-up">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-2.5">
            <UserRound className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Used for greetings, reports, and day boundaries.</p>
          </div>
        </div>
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
      </div>

      <div className="space-y-6">
        <div className="card p-6 animate-slide-up">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">App status</h3>
              <p className="text-sm text-slate-500">{demoMode ? 'Demo mode with browser-local data' : 'Connected to Supabase'}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-600"><Globe2 className="h-4 w-4" />Timezone</span>
              <span className="max-w-[11rem] truncate font-medium text-slate-900">{timezone || 'Detecting'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Storage</span>
              <span className="font-medium text-slate-900">{demoMode ? 'Local browser' : 'Cloud database'}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Data Export</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleExport}
              className="w-full rounded-lg btn-secondary px-4 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data (CSV)
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full rounded-lg btn-primary px-4 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export Weekly Report (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
