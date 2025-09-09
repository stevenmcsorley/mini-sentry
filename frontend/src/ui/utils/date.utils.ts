export const fmtDate = (iso: string): string => {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  } catch {
    return iso
  }
}

export const normISO = (s: string): string => {
  if (!s) return s
  if (s.endsWith('Z') || /[+-]\d\d:?\d\d$/.test(s)) return s.replace(' ', 'T')
  return s.replace(' ', 'T') + 'Z'
}

export const toInputLocal = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}