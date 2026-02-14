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
      {/* Hero: greeting + date, minimal */}
      <header className="mb-8">
        <p className="text-sm font-medium text-slate-500 mb-0.5">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
          {greeting}
        </h1>
      </header>

      {/* Stats strip */}
      <div className="mb-8 animate-slide-up">
        <DashboardStats />
      </div>

      {/* Main: Plan | Timeline | Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="lg:col-span-4 xl:col-span-3 animate-slide-up" style={{ animationDelay: '50ms' }} aria-label="Today's plan">
          <DailyPlanComponent />
        </section>
        <section className="lg:col-span-5 xl:col-span-6 min-w-0 animate-slide-up" style={{ animationDelay: '100ms' }} aria-label="Today's timeline">
          <TodayTimeline />
        </section>
        <aside className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '150ms' }} aria-label="Quick actions and progress">
          <EnergyTracker />
          <ActivityForm />
          <InterruptionForm />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StreaksPanel />
            <AchievementsPanel />
          </div>
        </aside>
      </div>

      {/* Bottom: Summary + Reflection */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="animate-slide-up min-w-0" aria-label="Daily summary">
          <DailySummary />
        </section>
        <section className="animate-slide-up min-w-0" aria-label="Daily reflection">
          <DailyReflectionComponent />
        </section>
      </div>
    </div>
  )
}
