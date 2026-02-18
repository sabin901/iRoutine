'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Activity, Interruption } from '@/lib/types'
import { format, parseISO, subDays, startOfDay } from 'date-fns'
import { Calendar, FileText, TrendingUp, Zap, Target, Sparkles } from 'lucide-react'

interface RecentItem {
  id: string
  title: string
  time: string
  sortTs: number
  meta?: string
  type: 'activity' | 'interruption' | 'focus' | 'milestone'
}

interface NewsItem {
  id: string
  title: string
  excerpt: string
  cta: string
}

export function InsightSection() {
  const [events, setEvents] = useState<RecentItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

      if (isPlaceholder) {
        const storedActivities = JSON.parse(localStorage.getItem('routine_activities') || '[]')
        const storedInterruptions = JSON.parse(localStorage.getItem('routine_interruptions') || '[]')
        buildEventsAndNews(storedActivities, storedInterruptions)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const weekStart = startOfDay(subDays(new Date(), 7))
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', weekStart.toISOString())
          .order('start_time', { ascending: false })
          .limit(20)
        const { data: interruptionsData } = await supabase
          .from('interruptions')
          .select('*')
          .eq('user_id', user.id)
          .gte('time', weekStart.toISOString())
          .order('time', { ascending: false })
          .limit(15)
        buildEventsAndNews(activitiesData || [], interruptionsData || [])
      }
    } catch (err) {
      console.error('Error loading insight section:', err)
      setEvents([])
      setNews(getDefaultNews())
    } finally {
      setLoading(false)
    }
  }

  function buildEventsAndNews(activities: any[], interruptions: any[]) {
    const recent: RecentItem[] = []
    activities.slice(0, 8).forEach((a: any) => {
      const start = typeof a.start_time === 'string' ? parseISO(a.start_time) : new Date(a.start_time)
      const end = typeof a.end_time === 'string' ? parseISO(a.end_time) : new Date(a.end_time)
      const mins = Math.round((end.getTime() - start.getTime()) / 60000)
      recent.push({
        id: a.id,
        title: `${a.category} · ${mins} min`,
        time: format(start, 'MMM d, h:mm a'),
        sortTs: start.getTime(),
        meta: a.note || undefined,
        type: ['Study', 'Coding', 'Work', 'Reading'].includes(a.category) ? 'focus' : 'activity',
      })
    })
    interruptions.slice(0, 3).forEach((i: any) => {
      const time = typeof i.time === 'string' ? parseISO(i.time) : new Date(i.time)
      recent.push({
        id: i.id,
        title: `Interruption · ${i.type}`,
        time: format(time, 'MMM d, h:mm a'),
        sortTs: time.getTime(),
        type: 'interruption',
      })
    })
    recent.sort((a, b) => b.sortTs - a.sortTs)
    setEvents(recent.slice(0, 6))

    const focusMins = activities
      .filter((a: any) => ['Study', 'Coding', 'Work', 'Reading'].includes(a.category))
      .reduce((sum: number, a: any) => {
        const s = typeof a.start_time === 'string' ? parseISO(a.start_time) : new Date(a.start_time)
        const e = typeof a.end_time === 'string' ? parseISO(a.end_time) : new Date(a.end_time)
        return sum + (e.getTime() - s.getTime()) / 60000
      }, 0)
    const sessionCount = activities.length
    const tip = focusMins >= 120
      ? 'You logged 2+ hours of focus this week. Keep protecting your deep work blocks.'
      : sessionCount >= 5
        ? 'Solid number of sessions. Try one longer block for a focus win.'
        : 'Log a few focus sessions to see your patterns and get better insights.'

    setNews([
      {
        id: '1',
        title: 'Weekly focus at a glance',
        excerpt: tip,
        cta: 'View focus heatmap',
      },
      {
        id: '2',
        title: 'Insight of the week',
        excerpt: interruptions.length
          ? `You had ${interruptions.length} interruption(s) this week. Check the interruption heatmap to see when they cluster.`
          : 'No interruptions logged this week. Great focus environment.',
        cta: 'Read more',
      },
      {
        id: '3',
        title: 'Quick tip',
        excerpt: 'Short reflections take under 2 minutes and make weekly reviews much more meaningful.',
        cta: 'Add reflection',
      },
    ])
  }

  function getDefaultNews(): NewsItem[] {
    return [
      { id: '1', title: 'Get started', excerpt: 'Log activities and interruptions to see your patterns and insights here.', cta: 'Go to Today' },
      { id: '2', title: 'Weekly review', excerpt: 'Export PDF or CSV from Settings for a clean weekly summary.', cta: 'Settings' },
      { id: '3', title: 'Focus blocks', excerpt: 'Track deep vs shallow work to see when you do your best work.', cta: 'Log activity' },
    ]
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-100/80 border border-slate-200 p-6 animate-pulse">
          <div className="h-5 bg-neutral-700 rounded w-24 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-700/50 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100/80 border border-slate-200 p-6 animate-pulse">
          <div className="h-5 bg-neutral-700 rounded w-20 mb-6" />
          <div className="h-24 bg-neutral-700/50 rounded-lg" />
        </div>
      </div>
    )
  }

  const trendStats = events.length
    ? { events: events.length, label: 'Recent items' }
    : { events: 0, label: 'Log activity to see trends' }

  return (
    <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xl">
      {/* TRENDS bar */}
      <div className="px-6 lg:px-8 py-4 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-6">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">This week</span>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400/80" />
          <span className="text-slate-900 text-sm font-medium">{trendStats.events} {trendStats.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-400/80" />
          <span className="text-slate-400 text-sm">Insights & tips below</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-700/50">
        {/* EVENTS block */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Recent activity
            </h2>
          </div>
          <ul className="space-y-4">
            {events.length === 0 ? (
              <li className="text-slate-500 text-sm">No recent activity. Log some to see events here.</li>
            ) : (
              events.map((e) => (
                <li key={e.id} className="group">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-slate-900 font-medium text-sm">{e.title}</p>
                      {e.meta && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{e.meta}</p>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap">{e.time}</span>
                  </div>
                  <div className="mt-1.5 h-px bg-slate-100 group-last:hidden" />
                </li>
              ))
            )}
          </ul>
          {events.length > 0 && (
            <p className="text-slate-500 text-xs mt-4">...</p>
          )}
        </div>

        {/* NEWS / INSIGHTS block */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Insights & tips
            </h2>
          </div>
          <div className="space-y-6">
            {news.map((n) => (
              <div key={n.id} className="group">
                <h3 className="text-slate-900 font-semibold text-sm mb-1.5">{n.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{n.excerpt}</p>
                <a
                  href="#"
                  className="inline-block mt-2 text-xs font-medium text-slate-300 hover:text-slate-900 transition-colors"
                >
                  {n.cta} →
                </a>
                <div className="mt-4 h-px bg-slate-100 group-last:hidden" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
