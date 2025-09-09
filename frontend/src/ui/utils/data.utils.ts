export const asList = <T = any>(d: any): T[] => {
  if (Array.isArray(d)) return d as T[]
  if (d && Array.isArray((d as any).results)) return (d as any).results as T[]
  return []
}