/**
 * PDF Export Utility
 * Generates professional weekly PDF reports
 */

import type { Activity, Interruption, DailyPlan } from './types'
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns'
import { calculateWeeklyMetrics, getTopCostDrivers, calculateAverageFocusQuality } from './interruption-metrics'

export interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  totalFocusHours: number
  totalInterruptionMinutes: number
  topCostDrivers: Array<{ type: string; total_cost: number; count: number }>
  bestFocusWindow: string
  avgRecoveryTime: number
  avgFocusQuality: number
  suggestions: string[]
}

/**
 * Generate weekly report data
 */
export function generateWeeklyReportData(
  activities: Activity[],
  interruptions: Interruption[],
  endDate: Date = new Date()
): WeeklyReportData {
  const weekStart = startOfDay(subDays(endDate, 6))
  const weekEnd = endOfDay(endDate)
  
  const weekActivities = activities.filter((a) => {
    const start = parseISO(a.start_time)
    return start >= weekStart && start <= weekEnd
  })
  
  const weekInterruptions = interruptions.filter((i) => {
    const time = parseISO(i.time)
    return time >= weekStart && time <= weekEnd
  })
  
  // Calculate focus hours
  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
  const focusActivities = weekActivities.filter((a) => focusCategories.includes(a.category))
  
  const totalFocusMinutes = focusActivities.reduce((sum, a) => {
    const start = parseISO(a.start_time)
    const end = parseISO(a.end_time)
    return sum + (end.getTime() - start.getTime()) / 1000 / 60
  }, 0)
  
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10
  
  // Calculate interruption time
  const totalInterruptionMinutes = weekInterruptions.reduce((sum, i) => 
    sum + (i.duration_minutes || 5), 0
  )
  
  // Get top cost drivers
  const topDrivers = getTopCostDrivers(weekInterruptions, weekActivities, 3)
  
  // Find best focus window
  const hourFocus: Record<number, number> = {}
  focusActivities.forEach((a) => {
    const start = parseISO(a.start_time)
    const hour = start.getHours()
    const duration = (parseISO(a.end_time).getTime() - start.getTime()) / 1000 / 60
    hourFocus[hour] = (hourFocus[hour] || 0) + duration
  })
  
  const peakHour = Object.entries(hourFocus).reduce((a, b) => 
    hourFocus[parseInt(a[0])] > hourFocus[parseInt(b[0])] ? a : b, ['0', '0'])[0]
  const nextHour = (parseInt(peakHour) + 1) % 24
  const bestFocusWindow = `${peakHour.padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`
  
  // Get metrics
  const metrics = calculateWeeklyMetrics(weekInterruptions, weekActivities)
  const qualityMetrics = calculateAverageFocusQuality(weekActivities, weekInterruptions)
  
  // Generate suggestions
  const suggestions: string[] = []
  
  if (topDrivers.length > 0 && topDrivers[0].total_cost > 50) {
    suggestions.push(`Focus on reducing ${topDrivers[0].type.toLowerCase()} interruptions - they're your highest cost driver.`)
  }
  
  if (metrics.avg_recovery_time && metrics.avg_recovery_time > 30) {
    suggestions.push(`Recovery time after interruptions is ${Math.round(metrics.avg_recovery_time)} minutes. Try shorter breaks to resume focus faster.`)
  }
  
  if (qualityMetrics.avg_quality < 70) {
    suggestions.push(`Your average focus quality is ${qualityMetrics.avg_quality}%. Try blocking time for deeper work sessions.`)
  }
  
  if (totalInterruptionMinutes < 30 && focusActivities.length > 5) {
    suggestions.push('You\'re maintaining excellent focus with minimal interruptions. Keep protecting your focus time!')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Keep tracking to discover more patterns and optimize your routine.')
  }
  
  return {
    weekStart: format(weekStart, 'MMMM d, yyyy'),
    weekEnd: format(weekEnd, 'MMMM d, yyyy'),
    totalFocusHours,
    totalInterruptionMinutes: Math.round(totalInterruptionMinutes),
    topCostDrivers: topDrivers.map(d => ({
      type: d.type,
      total_cost: Math.round(d.total_cost * 10) / 10,
      count: d.count,
    })),
    bestFocusWindow,
    avgRecoveryTime: metrics.avg_recovery_time || 0,
    avgFocusQuality: qualityMetrics.avg_quality,
    suggestions,
  }
}

/**
 * Generate PDF content as HTML (for jsPDF or similar)
 */
export function generatePDFHTML(data: WeeklyReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #111827;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #111827;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .metric-label {
      color: #6b7280;
      font-size: 14px;
    }
    .metric-value {
      font-weight: 600;
      font-size: 14px;
      color: #111827;
    }
    .cost-drivers {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      margin-top: 12px;
    }
    .cost-driver {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .suggestions {
      background: #d1fae5;
      padding: 16px;
      border-radius: 8px;
      margin-top: 12px;
    }
    .suggestion {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .suggestion:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Routine Weekly Report</h1>
    <div class="subtitle">${data.weekStart} - ${data.weekEnd}</div>
  </div>
  
  <div class="section">
    <div class="section-title">Summary</div>
    <div class="metric">
      <span class="metric-label">Total Focus Hours</span>
      <span class="metric-value">${data.totalFocusHours} hours</span>
    </div>
    <div class="metric">
      <span class="metric-label">Total Interruption Time</span>
      <span class="metric-value">${data.totalInterruptionMinutes} minutes</span>
    </div>
    <div class="metric">
      <span class="metric-label">Average Focus Quality</span>
      <span class="metric-value">${data.avgFocusQuality}%</span>
    </div>
    <div class="metric">
      <span class="metric-label">Best Focus Window</span>
      <span class="metric-value">${data.bestFocusWindow}</span>
    </div>
    ${data.avgRecoveryTime > 0 ? `
    <div class="metric">
      <span class="metric-label">Average Recovery Time</span>
      <span class="metric-value">${Math.round(data.avgRecoveryTime)} minutes</span>
    </div>
    ` : ''}
  </div>
  
  ${data.topCostDrivers.length > 0 ? `
  <div class="section">
    <div class="section-title">Top Interruption Cost Drivers</div>
    <div class="cost-drivers">
      ${data.topCostDrivers.map((driver, idx) => `
        <div class="cost-driver">
          <strong>${idx + 1}. ${driver.type}</strong> - ${driver.total_cost} total cost (${driver.count} interruptions)
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}
  
  <div class="section">
    <div class="section-title">Suggestions</div>
    <div class="suggestions">
      ${data.suggestions.map(s => `<div class="suggestion">• ${s}</div>`).join('')}
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Export as PDF using browser print (fallback)
 */
export function exportWeeklyPDF(
  data: WeeklyReportData,
  options?: { onPopupBlocked?: (message: string) => void }
) {
  const html = generatePDFHTML(data)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    const msg = 'Please allow popups to export PDF'
    options?.onPopupBlocked ? options.onPopupBlocked(msg) : alert(msg)
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}
