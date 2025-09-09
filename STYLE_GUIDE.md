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

## 🧩 React + TypeScript Component Style

### 1. **Component Declaration**
Use named exports with arrow functions. **Do not use React.FC or default exports.**

```typescript
// ✅ Professional - Named export with arrow function
export const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg px-4 py-2 font-medium"
    >
      {label}
    </button>
  )
}

// ❌ Avoid - React.FC and default exports
const Button: React.FC<ButtonProps> = ({ label }) => { ... }
export default Button
```

### 2. **Props Types: Separate Files for Shared Components**
Put props/interfaces in `Component.types.ts`. Use **type-only imports**.

```typescript
// src/components/Button/Button.types.ts
import type { ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "ghost"

export interface ButtonProps {
  label: string
  variant?: ButtonVariant
  disabled?: boolean
  onClick?: () => void
  /** Pass custom content instead of label (optional) */
  children?: ReactNode
}
```

```typescript
// src/components/Button/Button.tsx
import type { ButtonProps } from "./Button.types"

export const Button = ({ label, variant = "primary", disabled = false }: ButtonProps) => {
  // Component implementation
}
```

### 3. **Defaults & Destructuring**
Provide defaults via destructuring in parameter list (**not defaultProps**).

```typescript
// ✅ Good - Parameter defaults
export const Button = ({
  label,
  variant = "primary",
  disabled = false,
  onClick,
  children,
}: ButtonProps) => { /* ... */ }

// ❌ Avoid - defaultProps (deprecated)
Button.defaultProps = { variant: "primary", disabled: false }
```

### 4. **Children & Composition**
Only add `children` if the component is meant to render arbitrary content. Prefer composition over boolean props.

```typescript
// ✅ Good - Composition pattern
export const Card = ({ title, children }: CardProps) => (
  <section className="rounded-xl border p-4 shadow-sm">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div>{children}</div>
  </section>
)

// Card.types.ts
export interface CardProps {
  title: string
  children: ReactNode
}
```

### 5. **Event Handlers & DOM Types**
Use specific React event types. **Never use `any`**.

```typescript
// ✅ Professional - Specific event types
export type InputChange = React.ChangeEvent<HTMLInputElement>
export type ButtonClick = React.MouseEvent<HTMLButtonElement>

const handleChange = (e: InputChange) => { /* ... */ }
const handleClick = (e: ButtonClick) => { /* ... */ }

// ❌ Avoid - Generic or any types
const handleChange = (e: any) => { /* ... */ }
```

### 6. **className Merging**
Always accept `className?: string` on presentational components and merge with defaults.

```typescript
// ✅ Professional - Proper className merging
export const Box = ({ className, children }: BoxProps) => (
  <div className={["rounded-md p-2", className].filter(Boolean).join(" ")}>
    {children}
  </div>
)

// Box.types.ts
export interface BoxProps {
  className?: string
  children?: ReactNode
}
```

### 7. **Generics**
For generic components, annotate the arrow function with `<T,>` and keep props generic.

```typescript
// ✅ Professional - Generic components
export const List = <T,>({ items, renderItem, getKey }: ListProps<T>) => {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={getKey ? getKey(item, i) : i}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// List.types.ts
export interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  getKey?: (item: T, index: number) => string | number
}
```

### 8. **forwardRef & memo**
For ref exposure, use `forwardRef` with imported prop types; set `displayName`. Memoize only when profiling shows benefit.

```typescript
// ✅ Professional - forwardRef with displayName
const InputBase = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={["border p-2", className].join(" ")} {...props} />
  )
)
InputBase.displayName = "Input"

export const Input = memo(InputBase)
```

### 9. **File Layout**
One folder per component for shared/library components.

```
src/components/
  Button/
    Button.tsx
    Button.types.ts
    Button.test.tsx
    Button.stories.tsx
    index.ts
```

```typescript
// src/components/Button/index.ts
export * from "./Button"
export type { ButtonProps, ButtonVariant } from "./Button.types"
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

## ⚙️ Professional Configuration

### ESLint Rules
```json
{
  "rules": {
    "react/function-component-definition": [
      "error", 
      { "namedComponents": "arrow-function" }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { "prefer": "type-imports" }
    ],
    "react/jsx-props-no-spreading": "off",
    "import/prefer-default-export": "off"
  }
}
```

### TypeScript Config
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Component Quality Levels

#### **Shared/Library Components** (strict)
- ✅ Split types to `*.types.ts`
- ✅ Export via `index.ts`
- ✅ `forwardRef` when exposing refs
- ✅ Accessibility attributes
- ✅ Comprehensive test coverage
- ✅ Storybook stories

#### **Feature Components** (pragmatic)
- ✅ Arrow function components
- ✅ No `React.FC`
- ✅ Type-only imports
- ✅ Parameter defaults
- ⚠️ Co-located types OK for small components

## 📋 Professional Code Review Checklist

### **Component Structure**
- [ ] Named export with arrow function (`export const ComponentName = ...`)
- [ ] No `React.FC` usage
- [ ] Props destructured with parameter defaults
- [ ] Type-only imports (`import type { ... }`)

### **TypeScript Quality**
- [ ] Specific event types (never `any`)
- [ ] Proper generic component syntax (`<T,>`)
- [ ] `className?: string` on presentational components
- [ ] Explicit `children` only when needed

### **Accessibility & UX**
- [ ] ARIA attributes where needed
- [ ] Semantic HTML elements
- [ ] Focus states and keyboard navigation
- [ ] Loading states for async operations

### **Architecture**
- [ ] API calls in services layer
- [ ] No prop drilling (use hooks/context)
- [ ] Single responsibility principle
- [ ] Proper error handling and user feedback

### **Testing & E2E**
- [ ] Test-ids on interactive elements
- [ ] Hierarchical naming: `{component}-{element}-{id}`
- [ ] Unit testable (mockable dependencies)

## 🚀 Migration Strategy

1. **Phase 1**: Extract services layer and types
2. **Phase 2**: Convert components to modern syntax
3. **Phase 3**: Implement proper state management
4. **Phase 4**: Add comprehensive test coverage
5. **Phase 5**: Component library preparation

---

*This style guide should be updated as the codebase evolves and new patterns emerge.*