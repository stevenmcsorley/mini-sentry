import { asList } from '../data.utils'

describe('data utilities', () => {
  describe('asList', () => {
    it('returns array as-is if input is already array', () => {
      const input = [1, 2, 3]
      const result = asList(input)
      
      expect(result).toBe(input) // Same reference
      expect(result).toEqual([1, 2, 3])
    })

    it('returns empty array for non-array input', () => {
      expect(asList('string')).toEqual([])
      expect(asList(123)).toEqual([])
      expect(asList(true)).toEqual([])
    })

    it('returns empty array for null or undefined', () => {
      expect(asList(null)).toEqual([])
      expect(asList(undefined)).toEqual([])
    })

    it('extracts results array from paginated response object', () => {
      const paginatedResponse = {
        results: [{ id: 1 }, { id: 2 }, { id: 3 }],
        count: 3,
        next: null,
        previous: null
      }
      
      const result = asList(paginatedResponse)
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    it('returns empty array if object has non-array results property', () => {
      const invalidResponse = {
        results: 'not an array',
        count: 0
      }
      
      const result = asList(invalidResponse)
      expect(result).toEqual([])
    })

    it('returns empty array if object has no results property', () => {
      const objectWithoutResults = {
        data: [1, 2, 3],
        count: 3
      }
      
      const result = asList(objectWithoutResults)
      expect(result).toEqual([])
    })

    it('handles empty array input', () => {
      const result = asList([])
      expect(result).toEqual([])
    })

    it('handles empty results array in paginated response', () => {
      const paginatedResponse = {
        results: [],
        count: 0,
        next: null,
        previous: null
      }
      
      const result = asList(paginatedResponse)
      expect(result).toEqual([])
    })

    it('preserves types when generic is specified', () => {
      interface User {
        id: number
        name: string
      }
      
      const users: User[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
      const result = asList<User>(users)
      
      expect(result).toEqual(users)
      // Type assertion for testing - in real code this would be type-checked
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Alice')
    })

    it('works with paginated response containing typed results', () => {
      interface Item {
        id: number
        title: string
      }
      
      const paginatedResponse = {
        results: [
          { id: 1, title: 'First Item' },
          { id: 2, title: 'Second Item' }
        ] as Item[],
        count: 2
      }
      
      const result = asList<Item>(paginatedResponse)
      expect(result).toEqual([
        { id: 1, title: 'First Item' },
        { id: 2, title: 'Second Item' }
      ])
    })

    it('handles nested object with results property', () => {
      const nestedResponse = {
        data: {
          results: [1, 2, 3]
        }
      }
      
      // Should return empty array since results is not at top level
      const result = asList(nestedResponse)
      expect(result).toEqual([])
    })

    it('handles object with null results property', () => {
      const responseWithNullResults = {
        results: null,
        count: 0
      }
      
      const result = asList(responseWithNullResults)
      expect(result).toEqual([])
    })

    it('handles object with undefined results property', () => {
      const responseWithUndefinedResults = {
        results: undefined,
        count: 0
      }
      
      const result = asList(responseWithUndefinedResults)
      expect(result).toEqual([])
    })
  })
})