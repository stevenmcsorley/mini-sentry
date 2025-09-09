import React, { useState } from 'react'

interface AddTargetFormProps {
  ruleId: number
  onAdded: () => void
}

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function AddTargetForm({ ruleId, onAdded }: AddTargetFormProps) {
  const [type, setType] = useState<'email'|'webhook'>('email')
  const [value, setValue] = useState('alerts@example.test')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  
  const add = async () => {
    await api(`/api/alert-rules/${ruleId}/targets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: type, target_value: value, subject_template: subject, body_template: body })
    })
    onAdded()
  }
  
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }} data-testid="add-target-form">
      <select 
        value={type} 
        onChange={e => setType(e.target.value as any)} 
        style={{ padding: 6 }}
        data-testid="target-type-select"
      >
        <option value='email'>email</option>
        <option value='webhook'>webhook</option>
      </select>
      <input 
        value={value} 
        onChange={e => setValue(e.target.value)} 
        placeholder='target' 
        style={{ padding: 6, width: 220 }} 
        data-testid="target-value-input"
      />
      <input 
        value={subject} 
        onChange={e => setSubject(e.target.value)} 
        placeholder='subject template (optional)' 
        style={{ padding: 6, width: 220 }} 
        data-testid="subject-template-input"
      />
      <input 
        value={body} 
        onChange={e => setBody(e.target.value)} 
        placeholder='body template (optional)' 
        style={{ padding: 6, width: 260 }} 
        data-testid="body-template-input"
      />
      <button 
        onClick={add}
        data-testid="add-target-button"
      >
        Add target
      </button>
    </div>
  )
}