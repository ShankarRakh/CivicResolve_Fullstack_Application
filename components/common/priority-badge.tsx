import { cn } from '@/lib/utils'
import type { ComplaintPriority } from '@/types'
import { PRIORITY_CONFIG } from '@/lib/constants'

interface PriorityBadgeProps {
  priority: ComplaintPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
