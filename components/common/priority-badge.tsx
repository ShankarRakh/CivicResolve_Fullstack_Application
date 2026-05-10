import { cn } from '@/lib/utils'
import type { ComplaintPriority } from '@/types'
import { PRIORITY_CONFIG } from '@/lib/constants'

interface PriorityBadgeProps {
  priority: ComplaintPriority | string
  className?: string
}

const FALLBACK = { label: 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100' }

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  // Normalize to uppercase to handle both 'high' and 'HIGH'
  const key = priority.toUpperCase() as ComplaintPriority
  const config = PRIORITY_CONFIG[key] || FALLBACK

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
