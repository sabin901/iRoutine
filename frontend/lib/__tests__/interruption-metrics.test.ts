/**
 * Unit tests for interruption metrics engine
 * Tests core calculation logic for reliability
 */

import {
  calculateInterruptionCost,
  calculateDailyMetrics,
  calculateWeeklyMetrics,
  calculateFocusQuality,
  getTopCostDrivers,
} from '../interruption-metrics'
import type { Interruption, Activity } from '../types'
import { parseISO } from 'date-fns'

describe('Interruption Metrics Engine', () => {
  const mockActivity: Activity = {
    id: '1',
    user_id: 'user1',
    category: 'Work',
    start_time: '2024-01-15T09:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    note: 'Test work',
    created_at: '2024-01-15T09:00:00Z',
  }

  const mockInterruption: Interruption = {
    id: '1',
    user_id: 'user1',
    activity_id: null,
    time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T10:15:00Z',
    duration_minutes: 15,
    type: 'Phone',
    note: 'Test call',
    created_at: '2024-01-15T10:00:00Z',
  }

  describe('calculateInterruptionCost', () => {
    it('calculates cost with type and context weights', () => {
      const cost = calculateInterruptionCost(mockInterruption, [mockActivity])
      
      expect(cost.cost_score).toBeGreaterThan(0)
      expect(cost.duration_minutes).toBe(15)
      expect(cost.type_weight).toBe(1.2) // Phone
      expect(cost.context_weight).toBeGreaterThanOrEqual(1.0)
    })

    it('applies higher weight for Social Media', () => {
      const socialMediaInterruption: Interruption = {
        ...mockInterruption,
        type: 'Social Media',
      }
      
      const cost = calculateInterruptionCost(socialMediaInterruption, [mockActivity])
      expect(cost.type_weight).toBe(1.4)
    })

    it('applies context weight for early focus interruption', () => {
      const earlyInterruption: Interruption = {
        ...mockInterruption,
        time: '2024-01-15T09:10:00Z', // 10 min into focus session
      }
      
      const cost = calculateInterruptionCost(earlyInterruption, [mockActivity])
      expect(cost.context_weight).toBe(1.3) // Early in focus
    })
  })

  describe('calculateDailyMetrics', () => {
    it('calculates all daily metrics correctly', () => {
      const interruptions: Interruption[] = [
        { ...mockInterruption, duration_minutes: 10 },
        { ...mockInterruption, id: '2', duration_minutes: 20 },
        { ...mockInterruption, id: '3', duration_minutes: 5, type: 'Noise' },
      ]

      const metrics = calculateDailyMetrics(interruptions, [mockActivity], new Date('2024-01-15'))

      expect(metrics.total_interruptions_count).toBe(3)
      expect(metrics.total_interruptions_minutes).toBe(35)
      expect(metrics.avg_interruption_minutes).toBeCloseTo(11.7, 1)
      expect(metrics.longest_interruption_minutes).toBe(20)
      expect(metrics.top_interruption_type).toBe('Phone')
    })

    it('handles empty interruptions', () => {
      const metrics = calculateDailyMetrics([], [mockActivity])
      
      expect(metrics.total_interruptions_count).toBe(0)
      expect(metrics.total_interruptions_minutes).toBe(0)
      expect(metrics.avg_interruption_minutes).toBe(0)
    })
  })

  describe('calculateWeeklyMetrics', () => {
    it('calculates recovery times correctly', () => {
      const activities: Activity[] = [
        mockActivity,
        {
          ...mockActivity,
          id: '2',
          start_time: '2024-01-15T12:00:00Z',
          end_time: '2024-01-15T13:00:00Z',
        },
      ]

      const interruption: Interruption = {
        ...mockInterruption,
        time: '2024-01-15T10:30:00Z',
        end_time: '2024-01-15T10:45:00Z',
      }

      const metrics = calculateWeeklyMetrics([interruption], activities, new Date('2024-01-20'))
      
      expect(metrics.avg_recovery_time).toBeGreaterThan(0)
      expect(metrics.recovery_times.length).toBeGreaterThan(0)
    })

    it('calculates duration distribution', () => {
      const interruptions: Interruption[] = [
        { ...mockInterruption, duration_minutes: 3 }, // 0-5
        { ...mockInterruption, id: '2', duration_minutes: 10 }, // 5-15
        { ...mockInterruption, id: '3', duration_minutes: 25 }, // 15-30
        { ...mockInterruption, id: '4', duration_minutes: 45 }, // 30-60
        { ...mockInterruption, id: '5', duration_minutes: 90 }, // 60+
      ]

      const metrics = calculateWeeklyMetrics(interruptions, [], new Date('2024-01-20'))
      
      expect(metrics.interruption_duration_distribution['0-5']).toBe(1)
      expect(metrics.interruption_duration_distribution['5-15']).toBe(1)
      expect(metrics.interruption_duration_distribution['15-30']).toBe(1)
      expect(metrics.interruption_duration_distribution['30-60']).toBe(1)
      expect(metrics.interruption_duration_distribution['60+']).toBe(1)
    })
  })

  describe('calculateFocusQuality', () => {
    it('calculates quality for uninterrupted session', () => {
      const activity: Activity = {
        ...mockActivity,
        start_time: '2024-01-15T09:00:00Z',
        end_time: '2024-01-15T10:00:00Z',
      }

      const quality = calculateFocusQuality(activity, [])
      
      expect(quality.quality_score).toBeGreaterThanOrEqual(100)
      expect(quality.uninterrupted_minutes).toBe(60)
      expect(quality.interruptions_count).toBe(0)
    })

    it('applies penalty for interruptions', () => {
      const interruption: Interruption = {
        ...mockInterruption,
        time: '2024-01-15T09:30:00Z',
        end_time: '2024-01-15T09:45:00Z',
        duration_minutes: 15,
      }

      const quality = calculateFocusQuality(mockActivity, [interruption])
      
      expect(quality.quality_score).toBeLessThan(100)
      expect(quality.interruptions_count).toBe(1)
    })

    it('applies bonus for long sessions', () => {
      const longActivity: Activity = {
        ...mockActivity,
        start_time: '2024-01-15T09:00:00Z',
        end_time: '2024-01-15T10:00:00Z', // 60 minutes
      }

      const quality = calculateFocusQuality(longActivity, [])
      
      expect(quality.bonus_for_long_session).toBeGreaterThan(0)
    })
  })

  describe('getTopCostDrivers', () => {
    it('returns top cost drivers sorted by total cost', () => {
      const interruptions: Interruption[] = [
        { ...mockInterruption, type: 'Phone', duration_minutes: 10 },
        { ...mockInterruption, id: '2', type: 'Social Media', duration_minutes: 20 },
        { ...mockInterruption, id: '3', type: 'Phone', duration_minutes: 15 },
      ]

      const drivers = getTopCostDrivers(interruptions, [mockActivity], 2)
      
      expect(drivers.length).toBe(2)
      expect(drivers[0].total_cost).toBeGreaterThanOrEqual(drivers[1].total_cost)
    })

    it('calculates average cost correctly', () => {
      const interruptions: Interruption[] = [
        { ...mockInterruption, type: 'Phone', duration_minutes: 10 },
        { ...mockInterruption, id: '2', type: 'Phone', duration_minutes: 20 },
      ]

      const drivers = getTopCostDrivers(interruptions, [mockActivity], 1)
      
      expect(drivers[0].count).toBe(2)
      expect(drivers[0].avg_cost).toBeGreaterThan(0)
    })
  })
})
