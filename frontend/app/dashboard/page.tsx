import { TodayTimeline } from '@/components/dashboard/today-timeline'
import { ActivityForm } from '@/components/dashboard/activity-form'
import { InterruptionForm } from '@/components/dashboard/interruption-form'
import { DailyPlanComponent } from '@/components/dashboard/daily-plan'
import { DailySummary } from '@/components/dashboard/daily-summary'
import { StreaksPanel } from '@/components/dashboard/streaks-panel'
import { AchievementsPanel } from '@/components/dashboard/achievements-panel'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { EnergyTracker } from '@/components/dashboard/energy-tracker'
import { DailyReflectionComponent } from '@/components/dashboard/daily-reflection'
import { InsightStrip, PageHeader } from '@/components/dashboard/section-shell'
import { ActivationOnboarding } from '@/components/dashboard/activation-onboarding'
import { NextActionPanel } from '@/components/dashboard/next-action-panel'
import { format } from 'date-fns'
import Link from 'next/link'
import { LayoutDashboard, Plus } from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const today = format(new Date(), 'EEEE, MMMM d')
  const greeting = getGreeting()

  return (
    <div className="animate-fade-in pb-16">
      <div className="mb-8">
        <PageHeader
          icon={LayoutDashboard}
          section="Today"
          title={greeting}
          description={`${today}. Capture what happened, compare it to your plan, and close the loop before the day gets noisy.`}
          action={
            <Link href="/dashboard/planner" className="btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Plan day
            </Link>
          }
        >
          <InsightStrip
            items={[
              { label: 'Start here', value: 'Plan the day, then log reality as it happens', tone: 'sky' },
              { label: 'Protect', value: 'Watch interruption minutes before they become invisible loss', tone: 'amber' },
              { label: 'Recover', value: 'Energy and reflection make tomorrow easier to steer', tone: 'emerald' },
              { label: 'Review', value: 'Insights connect time, money, focus, and stress patterns', tone: 'slate' },
            ]}
          />
        </PageHeader>
      </div>

      <ActivationOnboarding />
      <NextActionPanel />

      <div className="mb-8 animate-slide-up">
        <DashboardStats />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <section className="animate-slide-up xl:col-span-2" style={{ animationDelay: '50ms' }} aria-label="Today's timeline">
          <TodayTimeline />
        </section>
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }} aria-label="Today's plan">
          <DailyPlanComponent />
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <section className="animate-slide-up" aria-label="Energy">
          <EnergyTracker />
        </section>
        <section className="animate-slide-up" aria-label="Log activity">
          <ActivityForm />
        </section>
        <section className="animate-slide-up" aria-label="Log interruption">
          <InterruptionForm />
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <section className="lg:col-span-2 animate-slide-up min-w-0" aria-label="Daily summary">
          <DailySummary />
        </section>
        <section className="animate-slide-up" aria-label="Streaks">
          <StreaksPanel />
        </section>
        <section className="animate-slide-up" aria-label="Achievements">
          <AchievementsPanel />
        </section>
      </div>

      <div className="mt-8 animate-slide-up">
        <DailyReflectionComponent />
      </div>
    </div>
  )
}
