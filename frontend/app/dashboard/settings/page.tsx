import { SettingsForm } from '@/components/dashboard/settings-form'
import { FeedbackForm } from '@/components/dashboard/feedback-form'
import { GrowthTools } from '@/components/dashboard/growth-tools'
import { BetaLaunchPanel } from '@/components/dashboard/beta-launch-panel'
import { InsightStrip, PageHeader } from '@/components/dashboard/section-shell'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader
        icon={Settings}
        section="Settings"
        title="Control Room"
        description="Keep identity, timezone, exports, and local data controls tidy so your personal operating system stays portable."
      >
        <InsightStrip
          items={[
            { label: 'Profile', value: 'Personalize the app context', tone: 'sky' },
            { label: 'Timezone', value: 'Keep daily reviews aligned to your real day', tone: 'emerald' },
            { label: 'Exports', value: 'Download CSV or weekly PDF reports', tone: 'amber' },
            { label: 'Demo mode', value: 'Local data remains on this browser', tone: 'slate' },
          ]}
        />
      </PageHeader>

      <SettingsForm />
      <BetaLaunchPanel />
      <GrowthTools />
      <FeedbackForm />
    </div>
  )
}
