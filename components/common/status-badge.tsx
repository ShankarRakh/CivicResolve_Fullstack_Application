import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/types'
import { COMPLAINT_STATUS_CONFIG } from '@/lib/constants'

interface StatusBadgeProps {
  status: ComplaintStatus | string
  className?: string
}

const FALLBACK = { label: 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100' }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Normalize to uppercase to handle both 'in_progress' and 'IN_PROGRESS'
  const key = status.toUpperCase() as ComplaintStatus
  const config = COMPLAINT_STATUS_CONFIG[key] || FALLBACK

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        key === 'PENDING' && 'bg-blue-500',
        key === 'ASSIGNED' && 'bg-indigo-500',
        key === 'IN_PROGRESS' && 'bg-amber-500',
        key === 'RESOLVED' && 'bg-emerald-500',
        key === 'REJECTED' && 'bg-red-500',
        key === 'CLOSED' && 'bg-gray-500',
      )} />
      {config.label}
    </span>
  )
}
