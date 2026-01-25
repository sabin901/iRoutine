/**
 * Advanced Insights Engine
 * Provides sophisticated analytics and pattern detection
 */

import { Activity, Interruption } from './types'
import { parseISO, format, startOfDay, differenceInMinutes, getHours, getDay } from 'date-fns'

export interface ProductivityCurve {
  hour: number
  focusMinutes: number
  interruptions: number
  quality: number
  label: string
}

export interface PatternDetection {
  type: 'positive' | 'negative' | 'neutral'
  pattern: string
  description: string
  confidence: number
  suggestion: string
}

export interface AdvancedInsights {
  productivityCurve: ProductivityCurve[]
  patterns: PatternDetection[]
  peakPerformance: {
    bestDay: string
    bestHour: string
    worstDay: string
    worstHour: string
  }
  correlations: {
    interruptionImpact: number
    recoveryTime: number
    focusQualityTrend: 'improving' | 'declining' | 'stable'
  }
  predictions: {
    optimalFocusWindow: string
    riskPeriods: string[]
    recommendations: string[]
  }
}

/**
 * Calculate productivity curve by hour of day
 */
export function calculateProductivityCurve(
  activities: Activity[],
  interruptions: Interruption[]
): ProductivityCurve[] {
  const hourlyData: Record<number, {
    focusMinutes: number
    interruptions: number
    sessions: number
  }> = {}

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { focusMinutes: 0, interruptions: 0, sessions: 0 }
  }

  // Process activities
  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
  activities
    .filter(a => focusCategories.includes(a.category))
    .forEach(activity => {
      const start = parseISO(activity.start_time)
      const end = parseISO(activity.end_time)
      const startHour = getHours(start)
      const duration = differenceInMinutes(end, start)
      
      hourlyData[startHour].focusMinutes += duration
      hourlyData[startHour].sessions += 1
    })

  // Process interruptions
  interruptions.forEach(interruption => {
    const time = parseISO(interruption.time)
    const hour = getHours(time)
    hourlyData[hour].interruptions += 1
  })

  // Calculate quality score for each hour
  return Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyData[hour]
    const quality = data.sessions > 0
      ? Math.max(0, 100 - (data.interruptions / data.sessions) * 20)
      : 0

    return {
      hour,
      focusMinutes: Math.round(data.focusMinutes),
      interruptions: data.interruptions,
      quality: Math.round(quality),
      label: `${hour.toString().padStart(2, '0')}:00`,
    }
  })
}

/**
 * Detect patterns in user behavior
 */
export function detectPatterns(
  activities: Activity[],
  interruptions: Interruption[]
): PatternDetection[] {
  const patterns: PatternDetection[] = []
  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']

  // Pattern 1: Morning vs Evening performance
  const morningActivities = activities.filter(a => {
    const hour = getHours(parseISO(a.start_time))
    return hour >= 6 && hour < 12 && focusCategories.includes(a.category)
  })
  
  const eveningActivities = activities.filter(a => {
    const hour = getHours(parseISO(a.start_time))
    return hour >= 18 && hour < 24 && focusCategories.includes(a.category)
  })

  const morningFocus = morningActivities.reduce((sum, a) => 
    sum + differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time)), 0
  )
  
  const eveningFocus = eveningActivities.reduce((sum, a) => 
    sum + differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time)), 0
  )

  if (morningFocus > eveningFocus * 1.5) {
    patterns.push({
      type: 'positive',
      pattern: 'Morning Performer',
      description: 'You are significantly more productive in the morning',
      confidence: 85,
      suggestion: 'Schedule your most important work before noon',
    })
  } else if (eveningFocus > morningFocus * 1.5) {
    patterns.push({
      type: 'positive',
      pattern: 'Evening Performer',
      description: 'You are significantly more productive in the evening',
      confidence: 85,
      suggestion: 'Consider starting your day later and working into the evening',
    })
  }

  // Pattern 2: Interruption clusters
  const interruptionsByHour: Record<number, number> = {}
  interruptions.forEach(i => {
    const hour = getHours(parseISO(i.time))
    interruptionsByHour[hour] = (interruptionsByHour[hour] || 0) + 1
  })

  const peakInterruptionHour = Object.entries(interruptionsByHour)
    .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 })

  if (peakInterruptionHour.count >= 3) {
    patterns.push({
      type: 'negative',
      pattern: 'Interruption Hotspot',
      description: `Most interruptions occur around ${peakInterruptionHour.hour}:00`,
      confidence: 90,
      suggestion: `Block ${peakInterruptionHour.hour}:00-${peakInterruptionHour.hour + 1}:00 for non-critical work`,
    })
  }

  // Pattern 3: Session length analysis
  const sessionLengths = activities
    .filter(a => focusCategories.includes(a.category))
    .map(a => differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time)))

  const avgSessionLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length

  if (avgSessionLength < 30) {
    patterns.push({
      type: 'negative',
      pattern: 'Short Focus Sessions',
      description: 'Your average focus session is under 30 minutes',
      confidence: 75,
      suggestion: 'Try the Pomodoro Technique: 25-minute focused sessions with 5-minute breaks',
    })
  } else if (avgSessionLength > 90) {
    patterns.push({
      type: 'neutral',
      pattern: 'Long Focus Sessions',
      description: 'Your average focus session exceeds 90 minutes',
      confidence: 75,
      suggestion: 'Consider taking more frequent breaks to maintain quality',
    })
  } else {
    patterns.push({
      type: 'positive',
      pattern: 'Optimal Session Length',
      description: 'Your focus sessions are in the optimal 30-90 minute range',
      confidence: 80,
      suggestion: 'Keep maintaining this healthy rhythm',
    })
  }

  // Pattern 4: Day of week analysis
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const focusByDay: Record<number, number> = {}
  
  activities
    .filter(a => focusCategories.includes(a.category))
    .forEach(a => {
      const day = getDay(parseISO(a.start_time))
      const duration = differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time))
      focusByDay[day] = (focusByDay[day] || 0) + duration
    })

  const bestDay = Object.entries(focusByDay)
    .reduce((max, [day, minutes]) => minutes > max.minutes ? { day: parseInt(day), minutes } : max, { day: 0, minutes: 0 })

  if (bestDay.minutes > 0) {
    patterns.push({
      type: 'positive',
      pattern: 'Weekly Peak',
      description: `${dayNames[bestDay.day]} is your most productive day`,
      confidence: 80,
      suggestion: `Schedule critical tasks on ${dayNames[bestDay.day]}`,
    })
  }

  // Pattern 5: Consistency analysis
  const dailyFocus: Record<string, number> = {}
  activities
    .filter(a => focusCategories.includes(a.category))
    .forEach(a => {
      const date = format(startOfDay(parseISO(a.start_time)), 'yyyy-MM-dd')
      const duration = differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time))
      dailyFocus[date] = (dailyFocus[date] || 0) + duration
    })

  const focusValues = Object.values(dailyFocus)
  if (focusValues.length > 3) {
    const avg = focusValues.reduce((sum, v) => sum + v, 0) / focusValues.length
    const variance = focusValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / focusValues.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / avg

    if (coefficientOfVariation < 0.3) {
      patterns.push({
        type: 'positive',
        pattern: 'Highly Consistent',
        description: 'Your daily focus time is very consistent',
        confidence: 90,
        suggestion: 'This consistency is excellent for building habits',
      })
    } else if (coefficientOfVariation > 0.7) {
      patterns.push({
        type: 'negative',
        pattern: 'Inconsistent Schedule',
        description: 'Your daily focus time varies significantly',
        confidence: 85,
        suggestion: 'Try to establish a more regular routine',
      })
    }
  }

  return patterns
}

/**
 * Generate advanced insights
 */
export function generateAdvancedInsights(
  activities: Activity[],
  interruptions: Interruption[]
): AdvancedInsights {
  const productivityCurve = calculateProductivityCurve(activities, interruptions)
  const patterns = detectPatterns(activities, interruptions)

  // Find peak performance times
  const sortedByFocus = [...productivityCurve].sort((a, b) => b.focusMinutes - a.focusMinutes)
  const sortedByInterruptions = [...productivityCurve].sort((a, b) => a.interruptions - b.interruptions)

  const bestHour = sortedByFocus[0]
  const worstHour = sortedByFocus[sortedByFocus.length - 1]

  // Day analysis
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const focusCategories = ['Study', 'Coding', 'Work', 'Reading']
  const focusByDay: Record<number, number> = {}
  
  activities
    .filter(a => focusCategories.includes(a.category))
    .forEach(a => {
      const day = getDay(parseISO(a.start_time))
      const duration = differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time))
      focusByDay[day] = (focusByDay[day] || 0) + duration
    })

  const sortedDays = Object.entries(focusByDay).sort((a, b) => b[1] - a[1])
  const bestDay = sortedDays[0] ? dayNames[parseInt(sortedDays[0][0])] : 'N/A'
  const worstDay = sortedDays[sortedDays.length - 1] ? dayNames[parseInt(sortedDays[sortedDays.length - 1][0])] : 'N/A'

  // Calculate correlations
  const totalInterruptions = interruptions.length
  const totalFocusMinutes = activities
    .filter(a => focusCategories.includes(a.category))
    .reduce((sum, a) => sum + differenceInMinutes(parseISO(a.end_time), parseISO(a.start_time)), 0)

  const interruptionImpact = totalFocusMinutes > 0 ? (totalInterruptions / totalFocusMinutes) * 100 : 0
  const avgRecoveryTime = interruptions.reduce((sum, i) => sum + (i.duration_minutes || 5), 0) / (interruptions.length || 1)

  // Determine focus quality trend (simplified)
  const recentActivities = activities.slice(-10)
  const olderActivities = activities.slice(0, 10)
  const recentQuality = recentActivities.length > 0 ? 80 : 0 // Simplified
  const olderQuality = olderActivities.length > 0 ? 75 : 0 // Simplified
  const focusQualityTrend: 'improving' | 'declining' | 'stable' = 
    recentQuality > olderQuality + 5 ? 'improving' : 
    recentQuality < olderQuality - 5 ? 'declining' : 'stable'

  // Generate predictions
  const lowInterruptionHours = productivityCurve
    .filter(h => h.interruptions <= 1 && h.focusMinutes > 0)
    .sort((a, b) => b.focusMinutes - a.focusMinutes)
    .slice(0, 3)

  const optimalFocusWindow = lowInterruptionHours.length > 0
    ? `${lowInterruptionHours[0].label} - ${lowInterruptionHours[lowInterruptionHours.length - 1].label}`
    : 'Need more data'

  const highRiskPeriods = productivityCurve
    .filter(h => h.interruptions >= 3)
    .map(h => h.label)

  // Generate smart recommendations
  const recommendations: string[] = []
  
  if (interruptionImpact > 5) {
    recommendations.push('Consider using "Do Not Disturb" mode during focus sessions')
  }
  
  if (avgRecoveryTime > 15) {
    recommendations.push('Your interruptions last long - try setting strict time limits')
  }

  if (totalFocusMinutes < 120) {
    recommendations.push('Aim for at least 2 hours of focused work per day')
  }

  const bestPatterns = patterns.filter(p => p.type === 'positive')
  if (bestPatterns.length > 0) {
    recommendations.push(`Leverage your ${bestPatterns[0].pattern.toLowerCase()} strength`)
  }

  return {
    productivityCurve,
    patterns,
    peakPerformance: {
      bestDay,
      bestHour: bestHour.label,
      worstDay,
      worstHour: worstHour.label,
    },
    correlations: {
      interruptionImpact: Math.round(interruptionImpact * 10) / 10,
      recoveryTime: Math.round(avgRecoveryTime),
      focusQualityTrend,
    },
    predictions: {
      optimalFocusWindow,
      riskPeriods: highRiskPeriods,
      recommendations,
    },
  }
}
