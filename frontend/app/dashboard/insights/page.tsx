'use client'

import { lazy, Suspense } from 'react'
import { BarChart3, Sparkles, TrendingUp, Brain } from 'lucide-react'

// Lazy load components for better performance
const CrossDomainInsights = lazy(() => import('@/components/dashboard/cross-domain-insights').then(m => ({ default: m.CrossDomainInsights })))
const SmartRecommendations = lazy(() => import('@/components/dashboard/smart-recommendations').then(m => ({ default: m.SmartRecommendations })))
const WhatChangedThisWeek = lazy(() => import('@/components/dashboard/what-changed-panel').then(m => ({ default: m.WhatChangedThisWeek })))
const PatternDetector = lazy(() => import('@/components/dashboard/pattern-detector').then(m => ({ default: m.PatternDetector })))
const ProductivityCurve = lazy(() => import('@/components/dashboard/productivity-curve').then(m => ({ default: m.ProductivityCurve })))
const FocusHeatmap = lazy(() => import('@/components/dashboard/focus-heatmap').then(m => ({ default: m.FocusHeatmap })))
const InterruptionHeatmap = lazy(() => import('@/components/dashboard/interruption-heatmap').then(m => ({ default: m.InterruptionHeatmap })))
const WeeklyInsights = lazy(() => import('@/components/dashboard/weekly-insights').then(m => ({ default: m.WeeklyInsights })))
const CategoryBreakdown = lazy(() => import('@/components/dashboard/category-breakdown').then(m => ({ default: m.CategoryBreakdown })))
const InsightsPanel = lazy(() => import('@/components/dashboard/insights-panel').then(m => ({ default: m.InsightsPanel })))

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 to-neutral-100/50"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-neutral-200 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Enhanced Header with Gradient */}
      <div className="animate-slide-up relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 via-purple-200/20 to-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Advanced Insights
              </h1>
              <p className="text-lg text-neutral-600 font-medium flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Discover patterns across time, money, energy, and focus
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Smart Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Domain Insights - Top Priority with Lazy Loading */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeleton />}>
          <CrossDomainInsights />
        </Suspense>
      </div>

      {/* Smart Recommendations */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeleton />}>
          <SmartRecommendations />
        </Suspense>
      </div>

      {/* What Changed This Week */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeleton />}>
          <WhatChangedThisWeek />
        </Suspense>
      </div>

      {/* AI Pattern Detection */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeleton />}>
          <PatternDetector />
        </Suspense>
      </div>

      {/* Productivity Curve */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeleton />}>
          <ProductivityCurve />
        </Suspense>
      </div>

      {/* Heatmaps Section */}
      <div className="space-y-6 animate-slide-up">
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<LoadingSkeleton />}>
            <FocusHeatmap />
          </Suspense>
          <Suspense fallback={<LoadingSkeleton />}>
            <InterruptionHeatmap />
          </Suspense>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3 animate-slide-up">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <WeeklyInsights />
          </Suspense>
          <Suspense fallback={<LoadingSkeleton />}>
            <CategoryBreakdown />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<LoadingSkeleton />}>
            <InsightsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
