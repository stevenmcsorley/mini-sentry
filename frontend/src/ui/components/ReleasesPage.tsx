import { useState, useCallback, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { LevelBadge } from './LevelBadge'
import { api } from '../utils/api.utils'
import { fmtDate } from '../utils/date.utils'
import type { Project, Release } from '../types/app.types'

interface ReleasesPageProps {
  selected: Project
  releases: Release[]
  onReleaseCreated: () => void
  className?: string
  testId?: string
}

interface ReleaseDetails extends Release {
  artifacts?: Array<{
    id: number
    name: string
    content_type: string
    file_name: string
    checksum: string
    created_at: string
  }>
}

export const ReleasesPage = ({ 
  selected, 
  releases, 
  onReleaseCreated,
  className,
  testId = 'releases-page'
}: ReleasesPageProps) => {
  const [selectedRelease, setSelectedRelease] = useState<ReleaseDetails | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newEnvironment, setNewEnvironment] = useState('production')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [uploadingTo, setUploadingTo] = useState<number | null>(null)
  const [showUploadGuide, setShowUploadGuide] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateRelease = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!newVersion.trim() || isCreating) return

    setIsCreating(true)
    try {
      await api('/api/releases/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: selected.id,
          version: newVersion.trim(),
          environment: newEnvironment,
          notes: releaseNotes.trim()
        })
      })
      setNewVersion('')
      setReleaseNotes('')
      onReleaseCreated()
    } catch (error) {
      console.error('Failed to create release:', error)
    } finally {
      setIsCreating(false)
    }
  }, [newVersion, newEnvironment, releaseNotes, selected.id, isCreating, onReleaseCreated])

  const handleViewArtifacts = useCallback(async (release: Release) => {
    try {
      const artifacts = await api(`/api/releases/${release.id}/artifacts/`)
      setSelectedRelease({ ...release, artifacts })
    } catch (error) {
      console.error('Failed to load artifacts:', error)
    }
  }, [])

  const handleFileUpload = useCallback(async (files: FileList, releaseId: number) => {
    if (!files.length) return

    setUploadingTo(releaseId)
    
    for (const file of Array.from(files)) {
      try {
        const content = await file.text()
        await api(`/api/releases/${releaseId}/artifacts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            content,
            content_type: file.type || 'application/json',
            file_name: file.name
          })
        })
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }
    
    setUploadingTo(null)
    if (selectedRelease?.id === releaseId) {
      handleViewArtifacts(releases.find(r => r.id === releaseId)!)
    }
  }, [selectedRelease, releases, handleViewArtifacts])

  const triggerFileUpload = useCallback((releaseId: number) => {
    setUploadingTo(releaseId)
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const target = e.target as HTMLInputElement
        if (target.files) {
          handleFileUpload(target.files, releaseId)
        }
      }
      fileInputRef.current.click()
    }
  }, [handleFileUpload])

  const generateUploadCommand = useCallback((release: Release) => {
    return `PROJECT_SLUG=${selected.slug} RELEASE_VERSION=${release.version} RELEASE_ENV=${release.environment} node upload_sourcemap.mjs`
  }, [selected.slug])

  return (
    <div className={[className].filter(Boolean).join(" ")} data-testid={testId}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Release Management</h1>
            <p className="text-slate-300 mt-1">
              Manage application versions, upload source maps, and track deployments for <span className="font-mono text-blue-300">{selected.slug}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadGuide(!showUploadGuide)}
              className="px-4 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              📖 Upload Guide
            </button>
            <div className="rounded-lg bg-slate-800/60 px-4 py-2">
              <div className="text-xs text-slate-400">Total Releases</div>
              <div className="text-2xl font-bold text-blue-400">{releases.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Guide */}
      {showUploadGuide && (
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-900/20 p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">🚀 Source Map Upload Guide</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-white mb-2">Option 1: File Upload (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                <li>Build your project with source maps enabled</li>
                <li>Click "Upload Files" on any release below</li>
                <li>Select your .map files from the build output</li>
                <li>Files are automatically uploaded and processed</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Option 2: CLI Upload</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                <li>Copy the upload_sourcemap.mjs script to your project</li>
                <li>Run the generated command for each release</li>
                <li>Script auto-detects .map files in ./dist directory</li>
                <li>Creates release if it doesn't exist</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Create New Release */}
      <div className="mb-8 rounded-xl border border-slate-800/60 bg-slate-800/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Release</h2>
        <form onSubmit={handleCreateRelease} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Version</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewVersion(e.target.value)}
                placeholder="e.g., 1.2.3, v2.0.0-beta.1"
                className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Environment</label>
              <select
                value={newEnvironment}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewEnvironment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Release Notes (Optional)</label>
            <textarea
              value={releaseNotes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReleaseNotes(e.target.value)}
              placeholder="What's new in this release..."
              className="w-full px-3 py-2 border border-slate-700 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              disabled={isCreating}
            />
          </div>
          <button
            type="submit"
            disabled={!newVersion.trim() || isCreating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Release'}
          </button>
        </form>
      </div>

      {/* Releases List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Existing Releases</h2>
        
        {releases.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-slate-800/60 bg-slate-800/10">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No releases yet</h3>
            <p className="text-slate-400">Create your first release above to start tracking versions and uploading source maps.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {releases.map(release => (
              <div key={release.id} className="rounded-xl border border-slate-800/60 bg-slate-800/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{release.version}</h3>
                    <LevelBadge 
                      level={release.environment} 
                      className="!bg-blue-500/20 !text-blue-300"
                    />
                    <span className="text-sm text-slate-400">{fmtDate(release.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewArtifacts(release)}
                      className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                    >
                      View Artifacts
                    </button>
                    <button
                      onClick={() => triggerFileUpload(release.id)}
                      disabled={uploadingTo === release.id}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {uploadingTo === release.id ? 'Uploading...' : 'Upload Files'}
                    </button>
                  </div>
                </div>

                {/* CLI Upload Command */}
                <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">CLI Upload Command:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateUploadCommand(release))}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-sm text-slate-300 font-mono block mt-1">
                    {generateUploadCommand(release)}
                  </code>
                </div>

                {/* Artifacts Modal */}
                {selectedRelease?.id === release.id && selectedRelease.artifacts && (
                  <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/30">
                    <div className="flex items-center justify-between p-3 border-b border-slate-700">
                      <h4 className="font-medium text-white">Artifacts ({selectedRelease.artifacts.length})</h4>
                      <button
                        onClick={() => setSelectedRelease(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-3">
                      {selectedRelease.artifacts.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">
                          No artifacts uploaded yet. Click "Upload Files" to add source maps.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedRelease.artifacts.map(artifact => (
                            <div key={artifact.id} className="flex items-center justify-between p-2 rounded bg-slate-800/40">
                              <div>
                                <div className="font-mono text-sm text-slate-200">{artifact.name}</div>
                                <div className="text-xs text-slate-400">
                                  {artifact.content_type} • {fmtDate(artifact.created_at)}
                                </div>
                              </div>
                              <div className="text-xs font-mono text-slate-400">
                                {artifact.checksum.slice(0, 8)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".map,.json"
        className="hidden"
      />
    </div>
  )
}