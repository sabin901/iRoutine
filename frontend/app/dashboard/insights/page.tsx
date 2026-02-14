'use client'

import { lazy, Suspense } from 'react'
import { BarChart3, Sparkles, Brain } from 'lucide-react'

// Lazy load components for better performance
const InsightSection = lazy(() => import('@/components/dashboard/insight-section').then(m => ({ default: m.InsightSection })))
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

function LoadingSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-64 bg-slate-100 rounded-xl" />
    </div>
  )
}

function LoadingSkeletonDark() {
  return (
    <div className="card p-8 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-32 mb-6" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

export default function InsightsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="animate-slide-up card overflow-hidden">
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
              <BarChart3 className="h-7 w-7 text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">/ Insights</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                Advanced Insights
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm lg:max-w-md flex items-center gap-2">
            <Brain className="h-4 w-4 text-slate-400 shrink-0" />
            Discover patterns across time, money, energy, and focus
          </p>
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 ml-auto">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Smart Analytics</span>
          </div>
        </div>
      </div>

      {/* Insight section – EVENTS + NEWS style (dark, modern) */}
      <div className="animate-slide-up">
        <Suspense fallback={<LoadingSkeletonDark />}>
          <InsightSection />
        </Suspense>
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
