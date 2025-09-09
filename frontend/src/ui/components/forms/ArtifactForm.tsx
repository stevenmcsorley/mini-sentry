import React, { useState } from 'react'

interface ArtifactFormProps {
  releaseId: number
}

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function ArtifactForm({ releaseId }: ArtifactFormProps) {
  const [content, setContent] = useState('{"function_map":{"minifiedFn":"Original.Name"}}')
  const [name, setName] = useState('symbols.json')
  
  const upload = async () => {
    await api(`/api/releases/${releaseId}/artifacts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, content_type: 'application/json' }),
    })
    alert('Uploaded')
  }
  
  return (
    <div style={{ display: 'flex', gap: 6 }} data-testid="artifact-form">
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        style={{ padding: 6, width: 160 }} 
        data-testid="artifact-name-input"
      />
      <input 
        value={content} 
        onChange={e => setContent(e.target.value)} 
        style={{ padding: 6, width: 320 }} 
        data-testid="artifact-content-input"
      />
      <button 
        onClick={upload}
        data-testid="upload-artifact-button"
      >
        Upload
      </button>
    </div>
  )
}