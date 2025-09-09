import { useState, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Project } from '../types/app.types'

interface ProjectsTabProps {
  projects: Project[]
  selected?: Project | null
  setSelected: (p: Project) => void
  onCreate: (name: string) => Promise<void> | void
  className?: string
  testId?: string
}

export const ProjectsTab = ({ 
  projects, 
  selected, 
  setSelected, 
  onCreate,
  className,
  testId = 'projects-tab' 
}: ProjectsTabProps) => {
  const [name, setName] = useState('My App')
  const [isCreating, setIsCreating] = useState(false)

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleCreate = useCallback(async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    if (!name.trim() || isCreating) return

    setIsCreating(true)
    try {
      await onCreate(name.trim())
      setName('My App')
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsCreating(false)
    }
  }, [name, onCreate, isCreating])

  const handleSelectProject = useCallback((project: Project) => {
    setSelected(project)
  }, [setSelected])

  return (
    <section 
      className={[
        "rounded-xl border border-slate-800/60 p-4",
        className
      ].filter(Boolean).join(" ")} 
      data-testid={testId}
    >
      <h4 className="mb-3 text-sm font-semibold">Projects</h4>
      
      <form onSubmit={handleCreate} className="mb-3 flex flex-wrap items-center gap-2">
        <input 
          type="text"
          className="rounded border border-slate-700 bg-slate-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={name} 
          onChange={handleNameChange}
          placeholder="Project name" 
          disabled={isCreating}
          data-testid="project-name-input"
          autoComplete="off"
        />
        <button 
          type="submit"
          disabled={!name.trim() || isCreating}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            !name.trim() || isCreating
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
          data-testid="create-project-button"
        >
          {isCreating ? 'Creating...' : 'Create Project'}
        </button>
      </form>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2">Slug</th>
              <th className="py-2">Name</th>
              <th className="py-2">Token</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr 
                key={p.id} 
                className={`border-t border-slate-800/60 ${
                  selected && selected.id === p.id ? 'bg-slate-800/30' : ''
                }`}
                data-testid={`project-row-${p.id}`}
              >
                <td className="py-2">{p.slug}</td>
                <td className="py-2">{p.name}</td>
                <td className="py-2 truncate">
                  <code className="text-xs bg-slate-800/60 px-2 py-1 rounded">
                    {p.ingest_token}
                  </code>
                </td>
                <td className="py-2">
                  <button 
                    type="button"
                    className="rounded border border-slate-700 px-3 py-1 text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    onClick={() => handleSelectProject(p)}
                    data-testid={`select-project-${p.id}`}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {projects.length === 0 && (
        <div className="text-center text-slate-400 py-8" data-testid="no-projects">
          No projects yet. Create your first project to get started.
        </div>
      )}
    </section>
  )
}