import type { SearchToken } from '../types/app.types'

export const parseTokens = (q: string): SearchToken[] => {
  const tokens: SearchToken[] = []
  const re = /(\w+):"([^"]+)"|(\w+):(\S+)|"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(q)) !== null) {
    if (m[1] && m[2]) tokens.push({ key: m[1], value: m[2], raw: m[0] })
    else if (m[3] && m[4]) tokens.push({ key: m[3], value: m[4], raw: m[0] })
    else if (m[5]) tokens.push({ value: m[5], raw: m[0] })
    else if (m[6]) tokens.push({ value: m[6], raw: m[0] })
  }
  return tokens
}

export const removeTokenFromQuery = (q: string, raw: string): string => {
  return q.replace(raw, '').replace(/\s+/g, ' ').trim()
}