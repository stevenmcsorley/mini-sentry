import React, { useState } from 'react'

interface ReleaseFormProps {
  onCreate: (version: string, env: string) => void
}

export function ReleaseForm({ onCreate }: ReleaseFormProps) {
  const [version, setVersion] = useState('1.0.0')
  const [env, setEnv] = useState('production')
  
  return (
    <div style={{ display: 'flex', gap: 8, margin: '8px 0' }} data-testid="release-form">
      <input 
        value={version} 
        onChange={e => setVersion(e.target.value)} 
        placeholder="Version" 
        style={{ padding: 6 }} 
        data-testid="release-version-input"
      />
      <input 
        value={env} 
        onChange={e => setEnv(e.target.value)} 
        placeholder="Environment" 
        style={{ padding: 6 }} 
        data-testid="release-environment-input"
      />
      <button 
        onClick={() => onCreate(version, env)}
        data-testid="create-release-button"
      >
        Create Release
      </button>
    </div>
  )
}