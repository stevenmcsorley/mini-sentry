import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: ReactNode
  testId?: string
}

const baseInputStyles = `
  w-full px-3 py-2
  border border-slate-700 bg-slate-800 text-white
  rounded-lg
  placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed
  transition-colors
`

export const Input = ({
  label,
  error,
  helpText,
  icon,
  className = '',
  testId,
  ...props
}: InputProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={`
          ${baseInputStyles}
          ${icon ? 'pl-10' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        data-testid={testId}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-400">{error}</p>
    )}
    {helpText && !error && (
      <p className="mt-1 text-sm text-slate-500">{helpText}</p>
    )}
  </div>
)

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  testId?: string
}

export const Select = ({
  label,
  error,
  options,
  className = '',
  testId,
  ...props
}: SelectProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
    )}
    <select
      className={`
        ${baseInputStyles}
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
        ${className}
      `}
      data-testid={testId}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="mt-1 text-sm text-red-400">{error}</p>
    )}
  </div>
)

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  testId?: string
}

export const Textarea = ({
  label,
  error,
  className = '',
  testId,
  ...props
}: TextareaProps) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
    )}
    <textarea
      className={`
        ${baseInputStyles}
        min-h-[100px] resize-y
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
        ${className}
      `}
      data-testid={testId}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-400">{error}</p>
    )}
  </div>
)

interface FormGroupProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export const FormGroup = ({ children, columns = 2, className = '' }: FormGroupProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3',
    4: 'grid-cols-1 lg:grid-cols-4'
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {children}
    </div>
  )
}
