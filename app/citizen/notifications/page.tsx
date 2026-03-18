'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Bell,
  BellOff,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Clock,
  Settings,
  CheckCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { NotificationType } from '@/types'

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  status_update: RefreshCw,
  comment: MessageSquare,
  assignment: Bell,
  sla_warning: Clock,
  sla_breach: AlertTriangle,
  system: Bell,
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    toast.success('All notifications marked as read')
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/citizen/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type]
            return (
              <Card
                key={notification.id}
                className={cn(
                  'transition-colors cursor-pointer hover:bg-muted/50',
                  !notification.isRead && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
                      notification.type === 'sla_warning' && 'bg-amber-100 text-amber-600',
                      notification.type === 'sla_breach' && 'bg-red-100 text-red-600',
                      notification.type === 'status_update' && 'bg-blue-100 text-blue-600',
                      notification.type === 'comment' && 'bg-emerald-100 text-emerald-600',
                      !['sla_warning', 'sla_breach', 'status_update', 'comment'].includes(notification.type) && 'bg-muted text-muted-foreground',
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'font-medium text-foreground',
                          !notification.isRead && 'font-semibold'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </span>
                        {notification.complaintId && (
                          <Link
                            href={`/citizen/complaints/${notification.complaintId}`}
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View complaint
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-foreground">No notifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You're all caught up! We'll notify you when something happens.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
