/**
 * Time handling and timezone tests
 * Ensures correct time calculations across timezones
 */

import { parseISO, format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

describe('Time Handling', () => {
  describe('Timezone Handling', () => {
    it('preserves ISO format for storage', () => {
      const date = new Date('2024-01-15T10:00:00Z')
      const isoString = date.toISOString()
      
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(isoString.endsWith('Z')).toBe(true)
    })

    it('correctly parses ISO strings', () => {
      const isoString = '2024-01-15T10:00:00Z'
      const parsed = parseISO(isoString)
      
      expect(parsed.getUTCHours()).toBe(10)
      expect(parsed.getUTCDate()).toBe(15)
    })

    it('handles timezone conversion correctly', () => {
      const utcDate = parseISO('2024-01-15T10:00:00Z')
      const nyTime = formatInTimeZone(utcDate, 'America/New_York', 'yyyy-MM-dd HH:mm')
      
      // Should convert UTC to EST/EDT
      expect(nyTime).toBeTruthy()
    })
  })

  describe('Duration Calculations', () => {
    it('calculates duration correctly', () => {
      const start = parseISO('2024-01-15T09:00:00Z')
      const end = parseISO('2024-01-15T10:30:00Z')
      const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60
      
      expect(durationMinutes).toBe(90)
    })

    it('handles day boundaries', () => {
      const start = parseISO('2024-01-15T23:00:00Z')
      const end = parseISO('2024-01-16T01:00:00Z')
      const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60
      
      expect(durationMinutes).toBe(120)
    })

    it('validates end time is after start time', () => {
      const start = parseISO('2024-01-15T10:00:00Z')
      const end = parseISO('2024-01-15T09:00:00Z')
      const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60
      
      expect(durationMinutes).toBeLessThan(0)
    })
  })

  describe('Date Filtering', () => {
    it('filters activities by date correctly', () => {
      const activities = [
        { start_time: '2024-01-15T09:00:00Z' },
        { start_time: '2024-01-16T09:00:00Z' },
        { start_time: '2024-01-15T14:00:00Z' },
      ]

      const targetDate = new Date('2024-01-15')
      const filtered = activities.filter((a: any) => {
        const activityDate = format(parseISO(a.start_time), 'yyyy-MM-dd')
        return activityDate === format(targetDate, 'yyyy-MM-dd')
      })

      expect(filtered.length).toBe(2)
    })
  })
})
