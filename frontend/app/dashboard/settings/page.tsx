import { SettingsForm } from '@/components/dashboard/settings-form'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="animate-slide-up card p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
            <Settings className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">/ Settings</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your preferences</p>
          </div>
        </div>
      </div>

      <SettingsForm />
    </div>
  )
}
