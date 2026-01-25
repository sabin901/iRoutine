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

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Enhanced Header with Gradient */}
      <div className="animate-slide-up relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Today
              </h1>
              <p className="text-base text-neutral-600 font-medium">
                Plan your day, track your time, reflect on your progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="animate-slide-up">
        <DashboardStats />
      </div>

      {/* Daily Plan Section */}
      <div className="animate-slide-up">
        <DailyPlanComponent />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up">
        <div className="lg:col-span-2 space-y-6">
          <TodayTimeline />
        </div>
        <div className="space-y-6">
          <EnergyTracker />
          <ActivityForm />
          <InterruptionForm />
          <StreaksPanel />
          <AchievementsPanel />
        </div>
      </div>

      {/* Daily Summary */}
      <div className="animate-slide-up">
        <DailySummary />
      </div>

      {/* Daily Reflection */}
      <div className="animate-slide-up">
        <DailyReflectionComponent />
      </div>
    </div>
  )
}
