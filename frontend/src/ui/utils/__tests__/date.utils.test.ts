import { fmtDate, normISO, toInputLocal } from '../date.utils'

describe('date utilities', () => {
  describe('fmtDate', () => {
    it('formats valid ISO date string', () => {
      const isoDate = '2024-01-15T10:30:45Z'
      const result = fmtDate(isoDate)
      
      // Result will vary by locale, but should contain the date elements
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/Jan/)
      expect(result).toMatch(/15/)
      expect(result).toMatch(/10:30:45/)
    })

    it('formats valid ISO date with timezone', () => {
      const isoDate = '2024-01-15T10:30:45+05:00'
      const result = fmtDate(isoDate)
      
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/Jan/)
      expect(result).toMatch(/15/)
    })

    it('returns Invalid Date for invalid date string', () => {
      const invalidDate = 'not-a-date'
      const result = fmtDate(invalidDate)
      
      // Invalid date strings result in 'Invalid Date' being returned
      expect(result).toBe('Invalid Date')
    })

    it('returns Invalid Date for empty string', () => {
      const result = fmtDate('')
      // Empty string creates Invalid Date object
      expect(result).toBe('Invalid Date')
    })

    it('returns Invalid Date for malformed ISO string', () => {
      const malformedDate = '2024-13-45T25:70:80Z' // Invalid month, day, hour, minute, second
      const result = fmtDate(malformedDate)
      
      // Malformed dates result in 'Invalid Date'
      expect(result).toBe('Invalid Date')
    })

    it('formats date consistently with expected locale options', () => {
      const isoDate = '2024-12-25T15:45:30Z'
      const result = fmtDate(isoDate)
      
      // Should use specified format options
      expect(result).toMatch(/Dec/) // Short month format
      expect(result).toMatch(/25/) // 2-digit day  
      expect(result).toMatch(/2024/) // Numeric year
      expect(result).toMatch(/(15:45:30|03:45:30 PM)/) // Time with seconds (24h or 12h format)
    })
  })

  describe('normISO', () => {
    it('returns string unchanged if it ends with Z', () => {
      const isoWithZ = '2024-01-15T10:30:45Z'
      expect(normISO(isoWithZ)).toBe(isoWithZ)
    })

    it('returns string unchanged if it has timezone offset', () => {
      const isoWithOffset = '2024-01-15T10:30:45+05:00'
      expect(normISO(isoWithOffset)).toBe(isoWithOffset)
    })

    it('returns string unchanged for timezone with no colon', () => {
      const isoWithOffset = '2024-01-15T10:30:45+0500'
      expect(normISO(isoWithOffset)).toBe(isoWithOffset)
    })

    it('returns string unchanged for negative timezone', () => {
      const isoWithOffset = '2024-01-15T10:30:45-08:00'
      expect(normISO(isoWithOffset)).toBe(isoWithOffset)
    })

    it('replaces space with T and adds Z for local datetime', () => {
      const localDateTime = '2024-01-15 10:30:45'
      const result = normISO(localDateTime)
      expect(result).toBe('2024-01-15T10:30:45Z')
    })

    it('adds Z to ISO string without timezone', () => {
      const isoNoTz = '2024-01-15T10:30:45'
      const result = normISO(isoNoTz)
      expect(result).toBe('2024-01-15T10:30:45Z')
    })

    it('handles empty string', () => {
      expect(normISO('')).toBe('')
    })

    it('handles space replacement with existing T', () => {
      const withSpace = '2024-01-15T10:30:45'
      const result = normISO(withSpace)
      expect(result).toBe('2024-01-15T10:30:45Z')
    })

    it('does not modify already correct ISO strings', () => {
      const correctIso = '2024-01-15T10:30:45Z'
      expect(normISO(correctIso)).toBe(correctIso)
    })
  })

  describe('toInputLocal', () => {
    it('converts ISO string to input datetime-local format', () => {
      // Mock Date constructor to have predictable timezone behavior
      const originalDate = Date
      global.Date = vi.fn().mockImplementation((dateString) => {
        const date = new originalDate(dateString)
        // Override methods to return fixed values for testing
        date.getFullYear = vi.fn().mockReturnValue(2024)
        date.getMonth = vi.fn().mockReturnValue(0) // January (0-indexed)
        date.getDate = vi.fn().mockReturnValue(15)
        date.getHours = vi.fn().mockReturnValue(10)
        date.getMinutes = vi.fn().mockReturnValue(30)
        return date
      }) as any
      
      const result = toInputLocal('2024-01-15T10:30:45Z')
      expect(result).toBe('2024-01-15T10:30')
      
      global.Date = originalDate
    })

    it('returns empty string for undefined input', () => {
      expect(toInputLocal(undefined)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(toInputLocal('')).toBe('')
    })

    it('pads single digit months and days', () => {
      const originalDate = Date
      global.Date = vi.fn().mockImplementation((dateString) => {
        const date = new originalDate(dateString)
        date.getFullYear = vi.fn().mockReturnValue(2024)
        date.getMonth = vi.fn().mockReturnValue(4) // May (0-indexed, so 4 = May)
        date.getDate = vi.fn().mockReturnValue(5)
        date.getHours = vi.fn().mockReturnValue(9)
        date.getMinutes = vi.fn().mockReturnValue(5)
        return date
      }) as any
      
      const result = toInputLocal('2024-05-05T09:05:30Z')
      expect(result).toBe('2024-05-05T09:05')
      
      global.Date = originalDate
    })

    it('handles end of year dates', () => {
      const originalDate = Date
      global.Date = vi.fn().mockImplementation((dateString) => {
        const date = new originalDate(dateString)
        date.getFullYear = vi.fn().mockReturnValue(2024)
        date.getMonth = vi.fn().mockReturnValue(11) // December (0-indexed)
        date.getDate = vi.fn().mockReturnValue(31)
        date.getHours = vi.fn().mockReturnValue(23)
        date.getMinutes = vi.fn().mockReturnValue(59)
        return date
      }) as any
      
      const result = toInputLocal('2024-12-31T23:59:59Z')
      expect(result).toBe('2024-12-31T23:59')
      
      global.Date = originalDate
    })
  })
})