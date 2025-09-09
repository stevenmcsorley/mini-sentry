# Mini Sentry UI - Development Style Guide

## 🎯 Architecture Principles

### Core Goals
- **Maintainable**: Easy to understand, modify, and extend
- **Testable**: Unit testable components with proper separation of concerns
- **Scalable**: Ready for new features without major refactors
- **Regression-safe**: Comprehensive test coverage to prevent breaking changes

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── forms/           # Form-specific components
│   ├── ui/              # Generic UI components (future component library)
│   └── layout/          # Layout-specific components
├── services/            # API calls and external services
│   ├── api/             # API service layer
│   └── adapters/        # API response adapters
├── types/               # Shared TypeScript interfaces and types
│   ├── api.types.ts     # API response types
│   ├── ui.types.ts      # UI component types
│   └── domain.types.ts  # Business domain types
├── hooks/               # Custom React hooks
├── utils/               # Pure utility functions
└── constants/           # Application constants
```

## 🧩 Component Design Patterns

### 1. **Modern Functional Components**
```typescript
// ✅ Good - Modern const syntax
const CoolComponent: React.FC<CoolComponentProps> = ({ prop1, prop2 }) => {
  return <div>Content</div>
}

// ❌ Avoid - Old function syntax
function CoolComponent(props) {
  return <div>Content</div>
}
```

### 2. **Component Props Interface**
```typescript
// ✅ Good - Clear interface with proper typing
interface CoolComponentProps {
  title: string
  onAction: (id: number) => void
  items?: Item[]
  testId?: string
}

const CoolComponent: React.FC<CoolComponentProps> = ({ 
  title, 
  onAction, 
  items = [], 
  testId = 'cool-component' 
}) => {
  return (
    <div data-testid={testId}>
      <h1>{title}</h1>
    </div>
  )
}
```

### 3. **State Management - No Prop Drilling**
```typescript
// ✅ Good - Use Context or custom hooks for shared state
const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProjectContext must be used within ProjectProvider')
  return context
}

// ✅ Good - Local state for component-specific data
const [isLoading, setIsLoading] = useState(false)
```

## 🔄 Services Layer Pattern

### API Service Structure
```typescript
// services/api/project.service.ts
export class ProjectService {
  private static readonly BASE_URL = '/api/projects'
  
  static async getAll(): Promise<Project[]> {
    const response = await fetch(this.BASE_URL)
    if (!response.ok) throw new Error('Failed to fetch projects')
    return response.json()
  }
  
  static async create(data: CreateProjectRequest): Promise<Project> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create project')
    return response.json()
  }
}
```

### Adapter Pattern for API Responses
```typescript
// services/adapters/project.adapter.ts
export class ProjectAdapter {
  static fromAPI(apiData: APIProject): Project {
    return {
      id: apiData.id,
      name: apiData.name,
      slug: apiData.slug,
      ingestToken: apiData.ingest_token, // Transform snake_case to camelCase
      createdAt: new Date(apiData.created_at)
    }
  }
  
  static toAPI(project: CreateProjectRequest): APICreateProjectRequest {
    return {
      name: project.name,
      // Transform camelCase to snake_case for API
    }
  }
}
```

## 🧪 Testing Strategy

### Test-IDs Convention
```typescript
// ✅ Good - Descriptive, hierarchical test-ids
<div data-testid="project-list">
  <div data-testid="project-item-123">
    <button data-testid="project-delete-button-123">Delete</button>
  </div>
</div>

// Format: {component}-{element}-{optional-id}
```

### Component Testing Structure
```typescript
// components/__tests__/ProjectList.test.tsx
describe('ProjectList', () => {
  it('should render projects correctly', () => {
    // Test implementation
  })
  
  it('should handle project deletion', () => {
    // Test implementation
  })
})
```

## 📝 TypeScript Best Practices

### Type Organization
```typescript
// types/domain.types.ts
export interface Project {
  id: number
  name: string
  slug: string
  ingestToken: string
  createdAt: Date
}

// types/api.types.ts
export interface APIProject {
  id: number
  name: string
  slug: string
  ingest_token: string
  created_at: string
}

// types/ui.types.ts
export interface ProjectListProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  selectedProject?: Project | null
}
```

### Generic Types
```typescript
// ✅ Good - Generic API response type
export interface APIResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// Usage
const projectsResponse: APIResponse<APIProject> = await ProjectService.getAll()
```

## 🎨 Component Library Standards

### Component Naming
- **PascalCase** for component names
- **Descriptive and specific** names
- **Consistent prefixes** for related components

```typescript
// ✅ Good examples
const ProjectList = () => {}
const ProjectForm = () => {}
const ProjectDeleteModal = () => {}

// ❌ Avoid
const List = () => {}
const Form = () => {}
const Modal = () => {}
```

### Component Composition
```typescript
// ✅ Good - Composable components
const ProjectCard: React.FC<ProjectCardProps> = ({ project, actions }) => (
  <Card>
    <CardHeader title={project.name} />
    <CardContent>
      <ProjectStats project={project} />
    </CardContent>
    <CardActions>{actions}</CardActions>
  </Card>
)
```

## 🔧 Performance Patterns

### Memoization
```typescript
// ✅ Good - Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// ✅ Good - Memoize callback functions
const handleClick = useCallback((id: number) => {
  onProjectSelect(projects.find(p => p.id === id))
}, [projects, onProjectSelect])
```

### Lazy Loading
```typescript
// ✅ Good - Lazy load heavy components
const HeavyChart = lazy(() => import('./components/HeavyChart'))
```

## 🚫 Anti-Patterns to Avoid

### ❌ Prop Drilling
```typescript
// ❌ Bad - Passing props through many levels
const App = () => {
  const [user, setUser] = useState()
  return <Layout user={user} setUser={setUser} />
}

const Layout = ({ user, setUser }) => {
  return <Header user={user} setUser={setUser} />
}

// ✅ Good - Use Context instead
const UserProvider = ({ children }) => {
  const [user, setUser] = useState()
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}
```

### ❌ Mixing Concerns
```typescript
// ❌ Bad - API calls directly in components
const ProjectList = () => {
  const [projects, setProjects] = useState([])
  
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(setProjects)
  }, [])
  
  return <div>{/* render */}</div>
}

// ✅ Good - Separate concerns with custom hooks
const useProjects = () => {
  const [projects, setProjects] = useState([])
  
  useEffect(() => {
    ProjectService.getAll().then(setProjects)
  }, [])
  
  return { projects, refetch: () => ProjectService.getAll().then(setProjects) }
}
```

## 📋 Code Review Checklist

- [ ] Components use modern const syntax
- [ ] Proper TypeScript interfaces defined
- [ ] Test-ids added for interactive elements
- [ ] No prop drilling (use Context/hooks instead)
- [ ] API calls abstracted to services layer
- [ ] Components are focused and single-responsibility
- [ ] Proper error handling implemented
- [ ] Performance optimizations (memoization) where needed
- [ ] Consistent naming conventions followed
- [ ] Accessibility considerations included

## 🚀 Migration Strategy

1. **Phase 1**: Extract services layer and types
2. **Phase 2**: Convert components to modern syntax
3. **Phase 3**: Implement proper state management
4. **Phase 4**: Add comprehensive test coverage
5. **Phase 5**: Component library preparation

---

*This style guide should be updated as the codebase evolves and new patterns emerge.*