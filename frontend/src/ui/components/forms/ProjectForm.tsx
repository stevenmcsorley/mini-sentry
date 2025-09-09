import React, { useState } from 'react'

interface ProjectFormProps {
  onCreate: (name: string) => void
}

export function ProjectForm({ onCreate }: ProjectFormProps) {
  const [name, setName] = useState('My App')
  
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }} data-testid="project-form">
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Project name" 
        style={{ padding: 6 }} 
        data-testid="project-name-input"
      />
      <button 
        onClick={() => onCreate(name)}
        data-testid="create-project-button"
      >
        Create
      </button>
    </div>
  )
}