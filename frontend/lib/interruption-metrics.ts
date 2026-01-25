/**
 * Interruption Metrics Engine
 * Computes deep, explainable metrics about interruptions
 */

import type { Interruption, Activity } from './types'
import { parseISO, startOfDay, endOfDay, isWithinInterval, format, subDays } from 'date-fns'

export interface InterruptionMetrics {
  // Per day metrics
  total_interruptions_count: number
  total_interruptions_minutes: number
  avg_interruption_minutes: number
  longest_interruption_minutes: number
  interruption_rate: number // interruptions per focus hour
  top_interruption_type: string | null
  
  // Per week metrics
  interruption_time_by_hour: Record<number, number>
  interruption_time_by_day: Record<string, number>
  interruption_duration_distribution: {
    '0-5': number
    '5-15': number
    '15-30': number
    '30-60': number
    '60+': number
  }
  recovery_times: number[] // minutes until next focus session
  avg_recovery_time: number
}

export interface InterruptionCost {
  interruption_id: string
  cost_score: number
  duration_minutes: number
  type_weight: number
  context_weight: number
  explanation: string
}

// Type weights for cost calculation
const TYPE_WEIGHTS: Record<string, number> = {
  'Phone': 1.2,
  'Social Media': 1.4,
  'Noise': 1.0,
  'Other': 1.1,
}

/**
 * Calculate interruption cost score
 */
export function calculateInterruptionCost(
  interruption: Interruption,
  activities: Activity[],
  deepWorkHours: number[] = [9, 10, 11, 14, 15] // Default deep work hours
): InterruptionCost {
  const duration = interruption.duration_minutes || 5 // Default 5 min if not set
  const typeWeight = TYPE_WEIGHTS[interruption.type] || 1.0
  
  // Check if interruption happened during focus session
  const interruptionTime = parseISO(interruption.time)
  const interruptionEnd = interruption.end_time ? parseISO(interruption.end_time) : interruptionTime
  
  // Find if interruption happened during a focus activity
  const activeFocusActivity = activities.find((a) => {
    if (!['Study', 'Coding', 'Work', 'Reading'].includes(a.category)) return false
    const start = parseISO(a.start_time)
    const end = parseISO(a.end_time)
    return isWithinInterval(interruptionTime, { start, end })
  })
  
  let contextWeight = 1.0
  let contextExplanation = 'normal context'
  
  if (activeFocusActivity) {
    const activityStart = parseISO(activeFocusActivity.start_time)
    const minutesIntoActivity = (interruptionTime.getTime() - activityStart.getTime()) / 1000 / 60
    
    // Within first 20 minutes of focus session
    if (minutesIntoActivity < 20) {
      contextWeight = 1.3
      contextExplanation = 'early in focus session'
    } else {
      contextWeight = 1.0
      contextExplanation = 'during focus session'
    }
  }
  
  // Check if in deep work window
  const hour = interruptionTime.getHours()
  if (deepWorkHours.includes(hour)) {
    contextWeight = Math.max(contextWeight, 1.2)
    if (contextWeight === 1.2) {
      contextExplanation = 'during deep work window'
    }
  }
  
  const costScore = duration * typeWeight * contextWeight
  
  const explanation = `${interruption.type} interruption (${duration} min) × ${typeWeight.toFixed(1)} type weight × ${contextWeight.toFixed(1)} context (${contextExplanation}) = ${costScore.toFixed(1)} cost`
  
  return {
    interruption_id: interruption.id,
    cost_score: costScore,
    duration_minutes: duration,
    type_weight: typeWeight,
    context_weight: contextWeight,
    explanation,
  }
}

/**
 * Calculate daily interruption metrics
 */
export function calculateDailyMetrics(
  interruptions: Interruption[],
  activities: Activity[],
  date: Date = new Date()
): Partial<InterruptionMetrics> {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  
  const dayInterruptions = interruptions.filter((i) => {
    const time = parseISO(i.time)
    return isWithinInterval(time, { start: dayStart, end: dayEnd })
  })
  
  if (dayInterruptions.length === 0) {
    return {
      total_interruptions_count: 0,
      total_interruptions_minutes: 0,
      avg_interruption_minutes: 0,
      longest_interruption_minutes: 0,
      interruption_rate: 0,
      top_interruption_type: null,
    }
  }
  
  const durations = dayInterruptions.map((i) => i.duration_minutes || 5)
  const totalMinutes = durations.reduce((sum, d) => sum + d, 0)
  const avgMinutes = totalMinutes / dayInterruptions.length
  const longestMinutes = Math.max(...durations)
  
  // Count by type
  const typeCounts: Record<string, number> = {}
  dayInterruptions.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
  })
  const topType = Object.entries(typeCounts).reduce((a, b) => 
    typeCounts[a[0]] > typeCounts[b[0]] ? a : b
  )[0]
  
  // Calculate focus hours for interruption rate
  const dayActivities = activities.filter((a) => {
    const start = parseISO(a.start_time)
    return isWithinInterval(start, { start: dayStart, end: dayEnd }) &&
           ['Study', 'Coding', 'Work', 'Reading'].includes(a.category)
  })
  
  const focusMinutes = dayActivities.reduce((sum, a) => {
    const start = parseISO(a.start_time)
    const end = parseISO(a.end_time)
    return sum + (end.getTime() - start.getTime()) / 1000 / 60
  }, 0)
  
  const focusHours = focusMinutes / 60
  const interruptionRate = focusHours > 0 ? dayInterruptions.length / focusHours : 0
  
  return {
    total_interruptions_count: dayInterruptions.length,
    total_interruptions_minutes: totalMinutes,
    avg_interruption_minutes: Math.round(avgMinutes * 10) / 10,
    longest_interruption_minutes: longestMinutes,
    interruption_rate: Math.round(interruptionRate * 10) / 10,
    top_interruption_type: topType,
  }
}

/**
 * Calculate weekly interruption metrics
 */
export function calculateWeeklyMetrics(
  interruptions: Interruption[],
  activities: Activity[],
  endDate: Date = new Date()
): Partial<InterruptionMetrics> {
  const weekStart = startOfDay(subDays(endDate, 6))
  const weekEnd = endOfDay(endDate)
  
  const weekInterruptions = interruptions.filter((i) => {
    const time = parseISO(i.time)
    return isWithinInterval(time, { start: weekStart, end: weekEnd })
  })
  
  const weekActivities = activities.filter((a) => {
    const start = parseISO(a.start_time)
    return isWithinInterval(start, { start: weekStart, end: weekEnd }) &&
           ['Study', 'Coding', 'Work', 'Reading'].includes(a.category)
  })
  
  // Interruption time by hour
  const timeByHour: Record<number, number> = {}
  weekInterruptions.forEach((i) => {
    const time = parseISO(i.time)
    const hour = time.getHours()
    const duration = i.duration_minutes || 5
    timeByHour[hour] = (timeByHour[hour] || 0) + duration
  })
  
  // Interruption time by day
  const timeByDay: Record<string, number> = {}
  weekInterruptions.forEach((i) => {
    const time = parseISO(i.time)
    const dayKey = format(time, 'yyyy-MM-dd')
    const duration = i.duration_minutes || 5
    timeByDay[dayKey] = (timeByDay[dayKey] || 0) + duration
  })
  
  // Duration distribution
  const distribution = {
    '0-5': 0,
    '5-15': 0,
    '15-30': 0,
    '30-60': 0,
    '60+': 0,
  }
  
  weekInterruptions.forEach((i) => {
    const duration = i.duration_minutes || 5
    if (duration <= 5) distribution['0-5']++
    else if (duration <= 15) distribution['5-15']++
    else if (duration <= 30) distribution['15-30']++
    else if (duration <= 60) distribution['30-60']++
    else distribution['60+']++
  })
  
  // Calculate recovery times
  const recoveryTimes: number[] = []
  
  weekInterruptions.forEach((interruption) => {
    const interruptionTime = parseISO(interruption.time)
    const interruptionEnd = interruption.end_time 
      ? parseISO(interruption.end_time) 
      : new Date(interruptionTime.getTime() + (interruption.duration_minutes || 5) * 60 * 1000)
    
    // Find next focus activity after interruption
    const nextFocusActivity = weekActivities
      .filter((a) => {
        const start = parseISO(a.start_time)
        return start > interruptionEnd
      })
      .sort((a, b) => {
        const startA = parseISO(a.start_time)
        const startB = parseISO(b.start_time)
        return startA.getTime() - startB.getTime()
      })[0]
    
    if (nextFocusActivity) {
      const nextStart = parseISO(nextFocusActivity.start_time)
      const recoveryMinutes = (nextStart.getTime() - interruptionEnd.getTime()) / 1000 / 60
      if (recoveryMinutes > 0 && recoveryMinutes < 480) { // Max 8 hours
        recoveryTimes.push(recoveryMinutes)
      }
    }
  })
  
  const avgRecoveryTime = recoveryTimes.length > 0
    ? Math.round((recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length) * 10) / 10
    : 0
  
  return {
    interruption_time_by_hour: timeByHour,
    interruption_time_by_day: timeByDay,
    interruption_duration_distribution: distribution,
    recovery_times: recoveryTimes,
    avg_recovery_time: avgRecoveryTime,
  }
}

export interface FocusQuality {
  activity_id: string
  quality_score: number // 0-100
  uninterrupted_minutes: number
  total_minutes: number
  interruptions_count: number
  context_switches: number
  bonus_for_long_session: number
  explanation: string
}

/**
 * Calculate focus quality score for an activity
 */
export function calculateFocusQuality(
  activity: Activity,
  interruptions: Interruption[]
): FocusQuality {
  const start = parseISO(activity.start_time)
  const end = parseISO(activity.end_time)
  const totalMinutes = (end.getTime() - start.getTime()) / 1000 / 60
  
  // Find interruptions during this activity
  const activityInterruptions = interruptions.filter((i) => {
    const interruptionTime = parseISO(i.time)
    return interruptionTime >= start && interruptionTime <= end
  })
  
  // Calculate uninterrupted time
  let uninterruptedMinutes = totalMinutes
  activityInterruptions.forEach((i) => {
    const duration = i.duration_minutes || 5
    uninterruptedMinutes = Math.max(0, uninterruptedMinutes - duration)
  })
  
  // Base quality: uninterrupted time / total time
  const baseQuality = totalMinutes > 0 ? (uninterruptedMinutes / totalMinutes) : 0
  
  // Penalty for context switching (multiple interruptions)
  const contextSwitches = activityInterruptions.length
  const contextPenalty = Math.min(contextSwitches * 0.1, 0.3) // Max 30% penalty
  
  // Bonus for long sessions (>45 minutes)
  let longSessionBonus = 0
  if (totalMinutes > 45) {
    longSessionBonus = Math.min((totalMinutes - 45) / 60 * 0.1, 0.2) // Up to 20% bonus
  }
  
  // Calculate final quality score (0-100)
  const qualityScore = Math.max(0, Math.min(100, 
    (baseQuality - contextPenalty + longSessionBonus) * 100
  ))
  
  const explanation = `Quality: ${Math.round(qualityScore)}% - ${Math.round(uninterruptedMinutes)}/${Math.round(totalMinutes)} min uninterrupted`
    + (contextSwitches > 0 ? `, ${contextSwitches} interruption${contextSwitches !== 1 ? 's' : ''}` : '')
    + (totalMinutes > 45 ? `, +${Math.round(longSessionBonus * 100)}% long session bonus` : '')
  
  return {
    activity_id: activity.id,
    quality_score: Math.round(qualityScore * 10) / 10,
    uninterrupted_minutes: Math.round(uninterruptedMinutes),
    total_minutes: Math.round(totalMinutes),
    interruptions_count: activityInterruptions.length,
    context_switches: contextSwitches,
    bonus_for_long_session: Math.round(longSessionBonus * 100),
    explanation,
  }
}

/**
 * Calculate average focus quality for a period
 */
export function calculateAverageFocusQuality(
  activities: Activity[],
  interruptions: Interruption[]
): { avg_quality: number; total_sessions: number; high_quality_sessions: number } {
  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
  const focusActivities = activities.filter((a) => focusCategories.includes(a.category))
  
  if (focusActivities.length === 0) {
    return { avg_quality: 0, total_sessions: 0, high_quality_sessions: 0 }
  }
  
  const qualities = focusActivities.map((a) => calculateFocusQuality(a, interruptions))
  const avgQuality = qualities.reduce((sum, q) => sum + q.quality_score, 0) / qualities.length
  const highQualitySessions = qualities.filter((q) => q.quality_score >= 70).length
  
  return {
    avg_quality: Math.round(avgQuality * 10) / 10,
    total_sessions: focusActivities.length,
    high_quality_sessions: highQualitySessions,
  }
}

/**
 * Get top cost drivers for a week
 */
export function getTopCostDrivers(
  interruptions: Interruption[],
  activities: Activity[],
  topN: number = 3
): Array<{ type: string; total_cost: number; count: number; avg_cost: number }> {
  const costs = interruptions.map((i) => calculateInterruptionCost(i, activities))
  
  const byType: Record<string, { total: number; count: number }> = {}
  
  costs.forEach((cost) => {
    const interruption = interruptions.find((i) => i.id === cost.interruption_id)
    if (!interruption) return
    
    if (!byType[interruption.type]) {
      byType[interruption.type] = { total: 0, count: 0 }
    }
    byType[interruption.type].total += cost.cost_score
    byType[interruption.type].count += 1
  })
  
  const drivers = Object.entries(byType)
    .map(([type, data]) => ({
      type,
      total_cost: Math.round(data.total * 10) / 10,
      count: data.count,
      avg_cost: Math.round((data.total / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, topN)
  
  return drivers
}
