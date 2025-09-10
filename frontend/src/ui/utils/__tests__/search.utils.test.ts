import { parseTokens, removeTokenFromQuery } from '../search.utils'

describe('search utilities', () => {
  describe('parseTokens', () => {
    it('parses key-value tokens with quoted values', () => {
      const query = 'project:"my-project" level:"error"'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        key: 'project',
        value: 'my-project',
        raw: 'project:"my-project"'
      })
      expect(tokens[1]).toEqual({
        key: 'level',
        value: 'error',
        raw: 'level:"error"'
      })
    })

    it('parses key-value tokens without quotes', () => {
      const query = 'project:backend level:warning'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        key: 'project',
        value: 'backend',
        raw: 'project:backend'
      })
      expect(tokens[1]).toEqual({
        key: 'level',
        value: 'warning',
        raw: 'level:warning'
      })
    })

    it('parses quoted phrases without keys', () => {
      const query = '"error message" "another phrase"'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        value: 'error message',
        raw: '"error message"'
      })
      expect(tokens[1]).toEqual({
        value: 'another phrase',
        raw: '"another phrase"'
      })
    })

    it('parses single words without quotes', () => {
      const query = 'error warning debug'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(3)
      expect(tokens[0]).toEqual({
        value: 'error',
        raw: 'error'
      })
      expect(tokens[1]).toEqual({
        value: 'warning',
        raw: 'warning'
      })
      expect(tokens[2]).toEqual({
        value: 'debug',
        raw: 'debug'
      })
    })

    it('parses mixed token types', () => {
      const query = 'project:"my-app" level:error "database error" timeout'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(4)
      expect(tokens[0]).toEqual({
        key: 'project',
        value: 'my-app',
        raw: 'project:"my-app"'
      })
      expect(tokens[1]).toEqual({
        key: 'level',
        value: 'error',
        raw: 'level:error'
      })
      expect(tokens[2]).toEqual({
        value: 'database error',
        raw: '"database error"'
      })
      expect(tokens[3]).toEqual({
        value: 'timeout',
        raw: 'timeout'
      })
    })

    it('handles empty string', () => {
      const tokens = parseTokens('')
      expect(tokens).toHaveLength(0)
    })

    it('handles whitespace only', () => {
      const tokens = parseTokens('   ')
      expect(tokens).toHaveLength(0)
    })

    it('handles key-value pairs with special characters in unquoted values', () => {
      const query = 'url:/api/users id:123'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        key: 'url',
        value: '/api/users',
        raw: 'url:/api/users'
      })
      expect(tokens[1]).toEqual({
        key: 'id',
        value: '123',
        raw: 'id:123'
      })
    })

    it('handles quotes within quoted values', () => {
      const query = 'message:"Error: \'Connection failed\'"'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(1)
      expect(tokens[0]).toEqual({
        key: 'message',
        value: 'Error: \'Connection failed\'',
        raw: 'message:"Error: \'Connection failed\'"'
      })
    })

    it('handles numeric values', () => {
      const query = 'count:42 timestamp:1640995200'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        key: 'count',
        value: '42',
        raw: 'count:42'
      })
      expect(tokens[1]).toEqual({
        key: 'timestamp',
        value: '1640995200',
        raw: 'timestamp:1640995200'
      })
    })

    it('handles underscore and hyphen in keys', () => {
      const query = 'user_id:123 project-name:test'
      const tokens = parseTokens(query)
      
      expect(tokens).toHaveLength(2)
      expect(tokens[0]).toEqual({
        key: 'user_id',
        value: '123',
        raw: 'user_id:123'
      })
      // The regex \w+ doesn't match hyphens, so "project-name:test" is treated as a single word token
      expect(tokens[1]).toEqual({
        value: 'project-name:test',
        raw: 'project-name:test'
      })
    })
  })

  describe('removeTokenFromQuery', () => {
    it('removes token from query', () => {
      const query = 'project:"my-app" level:error debug'
      const result = removeTokenFromQuery(query, 'level:error')
      
      expect(result).toBe('project:"my-app" debug')
    })

    it('removes quoted token from query', () => {
      const query = 'project:"my-app" "error message" debug'
      const result = removeTokenFromQuery(query, '"error message"')
      
      expect(result).toBe('project:"my-app" debug')
    })

    it('removes token at beginning of query', () => {
      const query = 'level:error project:"my-app" debug'
      const result = removeTokenFromQuery(query, 'level:error')
      
      expect(result).toBe('project:"my-app" debug')
    })

    it('removes token at end of query', () => {
      const query = 'project:"my-app" level:error debug'
      const result = removeTokenFromQuery(query, 'debug')
      
      expect(result).toBe('project:"my-app" level:error')
    })

    it('removes only token from query', () => {
      const query = 'level:error'
      const result = removeTokenFromQuery(query, 'level:error')
      
      expect(result).toBe('')
    })

    it('handles multiple spaces after removal', () => {
      const query = 'project:"my-app"   level:error   debug'
      const result = removeTokenFromQuery(query, 'level:error')
      
      expect(result).toBe('project:"my-app" debug')
    })

    it('returns original query if token not found', () => {
      const query = 'project:"my-app" level:error'
      const result = removeTokenFromQuery(query, 'notfound:token')
      
      expect(result).toBe('project:"my-app" level:error')
    })

    it('handles empty query', () => {
      const result = removeTokenFromQuery('', 'token')
      expect(result).toBe('')
    })

    it('handles empty token', () => {
      const query = 'project:"my-app" level:error'
      const result = removeTokenFromQuery(query, '')
      
      expect(result).toBe('project:"my-app" level:error')
    })

    it('trims leading and trailing whitespace', () => {
      const query = '   project:"my-app" level:error   '
      const result = removeTokenFromQuery(query, 'level:error')
      
      expect(result).toBe('project:"my-app"')
    })
  })
})