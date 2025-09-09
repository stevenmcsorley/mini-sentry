import React, { useState } from 'react'

interface AlertRuleFormProps {
  onCreate: (name: string, level: string, threshold: number, targetType: 'email'|'webhook', targetValue: string) => void
}

export function AlertRuleForm({ onCreate }: AlertRuleFormProps) {
  const [name, setName] = useState('High error volume')
  const [level, setLevel] = useState('error')
  const [threshold, setThreshold] = useState(10)
  const [targetType, setTargetType] = useState<'email'|'webhook'>('email')
  const [targetValue, setTargetValue] = useState('alerts@example.test')
  
  const handleTargetTypeChange = (newType: 'email'|'webhook') => {
    setTargetType(newType)
    // Update default value when switching types
    setTargetValue(newType === 'email' ? 'alerts@example.test' : 'https://your-webhook-url.com/alerts')
  }
  
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name" style={{ padding: 6, width: 180 }} />
      <input value={level} onChange={e => setLevel(e.target.value)} placeholder="Level (blank=any)" style={{ padding: 6, width: 140 }} />
      <input type="number" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} style={{ padding: 6, width: 100 }} />
      <select value={targetType} onChange={e => handleTargetTypeChange(e.target.value as any)} style={{ padding: 6 }} data-testid="alert-target-type-select">
        <option value="email">email</option>
        <option value="webhook">webhook</option>
      </select>
      <input 
        value={targetValue} 
        onChange={e => setTargetValue(e.target.value)} 
        placeholder={targetType === 'email' ? 'alerts@example.com' : 'https://webhook-url.com/alerts'} 
        style={{ padding: 6, width: 240 }} 
        data-testid="alert-target-input"
      />
      <button onClick={() => onCreate(name, level, threshold, targetType, targetValue)}>Add</button>
    </div>
  )
}