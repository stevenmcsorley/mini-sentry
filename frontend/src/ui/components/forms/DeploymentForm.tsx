import React, { useState } from 'react'

interface DeploymentFormProps {
  onCreate: (name: string, url: string, env: string, releaseId?: number) => void
}

export function DeploymentForm({ onCreate }: DeploymentFormProps) {
  const [name, setName] = useState('Deploy #1')
  const [url, setUrl] = useState('https://example.com')
  const [env, setEnv] = useState('production')
  
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }} data-testid="deployment-form">
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Name" 
        style={{ padding: 6, width: 180 }} 
        data-testid="deployment-name-input"
      />
      <input 
        value={url} 
        onChange={e => setUrl(e.target.value)} 
        placeholder="URL" 
        style={{ padding: 6, width: 240 }} 
        data-testid="deployment-url-input"
      />
      <input 
        value={env} 
        onChange={e => setEnv(e.target.value)} 
        placeholder="Environment" 
        style={{ padding: 6, width: 140 }} 
        data-testid="deployment-environment-input"
      />
      <button 
        onClick={() => onCreate(name, url, env)}
        data-testid="create-deployment-button"
      >
        Create
      </button>
    </div>
  )
}