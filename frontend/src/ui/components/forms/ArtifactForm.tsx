import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'

interface ArtifactFormProps {
  releaseId: number
  onUpload?: (success: boolean) => void
  className?: string
  testId?: string
}

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const ArtifactForm = ({ 
  releaseId, 
  onUpload,
  className,
  testId = 'artifact-form'
}: ArtifactFormProps) => {
  const [content, setContent] = useState('{"function_map":{"minifiedFn":"Original.Name"}}')
  const [name, setName] = useState('symbols.json')
  const [isUploading, setIsUploading] = useState(false)
  
  const handleUpload = useCallback(async () => {
    if (!name.trim() || !content.trim() || isUploading) return
    
    setIsUploading(true)
    try {
      await api(`/api/releases/${releaseId}/artifacts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, content_type: 'application/json' }),
      })
      setName('')
      setContent('{"function_map":{"minifiedFn":"Original.Name"}}')
      onUpload?.(true)
    } catch (error) {
      console.error('Upload failed:', error)
      onUpload?.(false)
    } finally {
      setIsUploading(false)
    }
  }, [name, content, releaseId, isUploading, onUpload])

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleContentChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value)
  }, [])
  
  const disabled = !name.trim() || !content.trim() || isUploading

  return (
    <div className={["flex gap-2", className].filter(Boolean).join(" ")} data-testid={testId}>
      <input 
        type="text"
        value={name} 
        onChange={handleNameChange} 
        placeholder="Artifact name"
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 160 }}
        disabled={isUploading}
        data-testid="artifact-name-input"
      />
      <input 
        type="text"
        value={content} 
        onChange={handleContentChange} 
        placeholder="JSON content"
        className="px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: 320 }}
        disabled={isUploading}
        data-testid="artifact-content-input"
      />
      <button 
        onClick={handleUpload}
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          disabled 
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
            : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
        }`}
        data-testid="upload-artifact-button"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}