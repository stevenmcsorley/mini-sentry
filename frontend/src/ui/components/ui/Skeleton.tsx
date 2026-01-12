interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  testId?: string
}

export const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  testId
}: SkeletonProps) => {
  const baseStyles = 'animate-pulse bg-slate-700/50'

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      data-testid={testId}
    />
  )
}

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={i === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-xl border border-slate-800/60 bg-slate-800/20 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" className="w-32 h-6" />
      <Skeleton variant="rectangular" className="w-20 h-6" />
    </div>
    <SkeletonText lines={2} />
  </div>
)

export const SkeletonTable = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="flex gap-4 pb-2 border-b border-slate-800/60">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="flex-1 h-4" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex gap-4 py-2">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Skeleton key={colIdx} variant="text" className="flex-1 h-4" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonStats = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-800/20 p-4 text-center">
        <Skeleton variant="text" className="w-16 h-8 mx-auto mb-2" />
        <Skeleton variant="text" className="w-24 h-4 mx-auto" />
      </div>
    ))}
  </div>
)

interface LoadingOverlayProps {
  message?: string
  testId?: string
}

export const LoadingOverlay = ({ message = 'Loading...', testId }: LoadingOverlayProps) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl z-10"
    data-testid={testId}
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
    <p className="mt-3 text-sm text-slate-400">{message}</p>
  </div>
)
