'use client'

import { cn } from '@/lib/utils'
import { Clock, AlertTriangle } from 'lucide-react'

interface SLATimerProps {
  deadline: string
  breached?: boolean
  remainingHours?: number
  compact?: boolean
  showProgress?: boolean
  className?: string
}

export function SLATimer({ deadline, breached = false, remainingHours, compact, showProgress, className }: SLATimerProps) {
  const hours = remainingHours ?? calculateRemainingHours(deadline)
  const isWarning = hours <= 8 && hours > 0
  const isCritical = hours <= 2 && hours > 0

  if (breached || hours <= 0) {
    const overdueHours = hours <= 0 ? Math.abs(hours) : 0
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-red-700', className)}>
        <AlertTriangle className="h-3 w-3" />
        {overdueHours > 24 
          ? `${Math.floor(overdueHours / 24)}d overdue`
          : `${overdueHours}h overdue`
        }
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isCritical && 'text-red-600',
        isWarning && !isCritical && 'text-amber-600',
        !isWarning && !isCritical && 'text-muted-foreground',
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h left` : `${hours}h left`}
    </span>
  )
}

function calculateRemainingHours(deadline: string): number {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()
  return Math.round(diffMs / (1000 * 60 * 60))
}
