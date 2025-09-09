# Professional React + TypeScript Component Templates

## 📋 Basic Component Template

### Component.types.ts
```typescript
import type { ReactNode } from "react"

export interface ComponentNameProps {
  /** Main content or label */
  title: string
  /** Additional CSS classes */
  className?: string
  /** Child content (only if component accepts children) */
  children?: ReactNode
  /** Loading state for async operations */
  isLoading?: boolean
  /** Test identifier for E2E tests */
  testId?: string
  /** Click handler with specific event type */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}
```

### Component.tsx
```typescript
import type { ComponentNameProps } from "./ComponentName.types"

export const ComponentName = ({
  title,
  className,
  children,
  isLoading = false,
  testId = "component-name",
  onClick
}: ComponentNameProps) => {
  // Component logic here
  
  return (
    <div 
      className={["base-styles", className].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <h2>{title}</h2>
      {children && <div>{children}</div>}
      {onClick && (
        <button 
          onClick={onClick}
          disabled={isLoading}
          data-testid={`${testId}-action`}
        >
          {isLoading ? "Loading..." : "Action"}
        </button>
      )}
    </div>
  )
}
```

### index.ts
```typescript
export { ComponentName } from "./ComponentName"
export type { ComponentNameProps } from "./ComponentName.types"
```

## 🔄 Form Component Template

### FormComponent.types.ts
```typescript
export interface FormComponentProps {
  /** Form submission handler */
  onSubmit: (data: FormData) => Promise<void> | void
  /** Initial form values */
  initialValues?: Partial<FormData>
  /** Loading state */
  isLoading?: boolean
  /** Form validation errors */
  errors?: Record<string, string>
  /** Test identifier */
  testId?: string
}

export interface FormData {
  name: string
  email: string
  // Add other form fields
}
```

### FormComponent.tsx
```typescript
import { useState, useCallback } from "react"
import type { FormComponentProps, FormData } from "./FormComponent.types"

export const FormComponent = ({
  onSubmit,
  initialValues = {},
  isLoading = false,
  errors = {},
  testId = "form-component"
}: FormComponentProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    ...initialValues
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      // Reset form on success if needed
      setFormData({ name: "", email: "" })
    } catch (error) {
      console.error("Form submission failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onSubmit, isLoading, isSubmitting])

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const disabled = isLoading || isSubmitting

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={testId}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          data-testid={`${testId}-name-input`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" data-testid={`${testId}-name-error`}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          data-testid={`${testId}-email-input`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" data-testid={`${testId}-email-error`}>
            {errors.email}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={`w-full rounded-md px-4 py-2 font-medium ${
          disabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        data-testid={`${testId}-submit`}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  )
}
```

## 🎨 Generic Component Template

### GenericComponent.types.ts
```typescript
import type { ReactNode } from "react"

export interface GenericComponentProps<T> {
  /** Array of items to render */
  items: T[]
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Function to get unique key for each item */
  getKey?: (item: T, index: number) => string | number
  /** Loading state */
  isLoading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Test identifier */
  testId?: string
}
```

### GenericComponent.tsx
```typescript
import type { GenericComponentProps } from "./GenericComponent.types"

export const GenericComponent = <T,>({
  items,
  renderItem,
  getKey,
  isLoading = false,
  emptyMessage = "No items found",
  testId = "generic-component"
}: GenericComponentProps<T>) => {
  if (isLoading) {
    return (
      <div className="animate-pulse" data-testid={`${testId}-loading`}>
        Loading...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8" data-testid={`${testId}-empty`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      {items.map((item, index) => (
        <div key={getKey ? getKey(item, index) : index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
```

## 🪝 Custom Hook Template

### useCustomHook.ts
```typescript
import { useState, useEffect, useCallback } from "react"

export interface UseCustomHookOptions {
  /** Initial value */
  initialValue?: string
  /** Auto-fetch on mount */
  autoFetch?: boolean
}

export interface UseCustomHookReturn {
  /** Current value */
  value: string
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Update function */
  setValue: (newValue: string) => void
  /** Async fetch function */
  fetchData: () => Promise<void>
  /** Reset to initial state */
  reset: () => void
}

export const useCustomHook = ({
  initialValue = "",
  autoFetch = true
}: UseCustomHookOptions = {}): UseCustomHookReturn => {
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      const response = await fetch("/api/data")
      if (!response.ok) throw new Error("Failed to fetch")
      
      const data = await response.text()
      setValue(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      console.error("Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setValue(initialValue)
    setError(null)
    setIsLoading(false)
  }, [initialValue])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return {
    value,
    isLoading,
    error,
    setValue,
    fetchData,
    reset
  }
}
```

## 🧪 Test Template

### Component.test.tsx
```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ComponentName } from "./ComponentName"
import type { ComponentNameProps } from "./ComponentName.types"

const defaultProps: ComponentNameProps = {
  title: "Test Component",
  testId: "test-component"
}

describe("ComponentName", () => {
  it("renders with required props", () => {
    render(<ComponentName {...defaultProps} />)
    
    expect(screen.getByTestId("test-component")).toBeInTheDocument()
    expect(screen.getByText("Test Component")).toBeInTheDocument()
  })

  it("handles loading state", () => {
    render(<ComponentName {...defaultProps} isLoading />)
    
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("calls onClick when button is clicked", async () => {
    const mockClick = jest.fn()
    
    render(<ComponentName {...defaultProps} onClick={mockClick} />)
    
    const button = screen.getByTestId("test-component-action")
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockClick).toHaveBeenCalledTimes(1)
    })
  })

  it("applies custom className", () => {
    render(<ComponentName {...defaultProps} className="custom-class" />)
    
    const element = screen.getByTestId("test-component")
    expect(element).toHaveClass("custom-class")
  })
})
```

---

These templates follow all professional standards:
- ✅ Arrow function exports
- ✅ No `React.FC`
- ✅ Type-only imports
- ✅ Parameter defaults
- ✅ Specific event types
- ✅ Comprehensive test-ids
- ✅ Proper error handling
- ✅ Accessibility considerations