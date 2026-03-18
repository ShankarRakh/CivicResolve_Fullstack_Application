import { cn } from '@/lib/utils'
import type { ComplaintStatus } from '@/types'
import { COMPLAINT_STATUS_CONFIG } from '@/lib/constants'

interface StatusBadgeProps {
  status: ComplaintStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = COMPLAINT_STATUS_CONFIG[status]
  
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
        status === 'pending' && 'bg-blue-500',
        status === 'assigned' && 'bg-indigo-500',
        status === 'in_progress' && 'bg-amber-500',
        status === 'work_completed' && 'bg-teal-500',
        status === 'resolved' && 'bg-emerald-500',
        status === 'rejected' && 'bg-red-500',
        status === 'closed' && 'bg-gray-500',
        status === 'reopened' && 'bg-orange-500',
      )} />
      {config.label}
    </span>
  )
}
