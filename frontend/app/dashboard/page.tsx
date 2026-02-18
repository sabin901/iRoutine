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
import { format } from 'date-fns'

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
      <header className="mb-8">
        <p className="text-sm font-medium text-slate-500 mb-0.5">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
          {greeting}
        </h1>
      </header>

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
