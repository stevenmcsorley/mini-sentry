import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  testId?: string
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white border border-slate-700 focus:ring-slate-500'
}

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

const disabledStyles = 'bg-slate-600 text-slate-400 cursor-not-allowed hover:bg-slate-600'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  className = '',
  testId,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
        ${isDisabled ? disabledStyles : variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isDisabled}
      data-testid={testId}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="h-4 w-4">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  label: string
  testId?: string
}

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
}

export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  disabled,
  className = '',
  testId,
  ...props
}: IconButtonProps) => (
  <button
    className={`
      inline-flex items-center justify-center rounded-lg
      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
      ${disabled ? disabledStyles : variants[variant]}
      ${iconSizes[size]}
      ${className}
    `}
    disabled={disabled}
    aria-label={label}
    title={label}
    data-testid={testId}
    {...props}
  >
    {icon}
  </button>
)
