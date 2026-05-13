import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'

// Derive a title from notification type
function deriveTitle(type: string): string {
  switch (type) {
    case 'status_update': return 'Status Updated'
    case 'comment': return 'New Comment'
    case 'assignment': return 'Complaint Assigned'
    case 'sla_warning': return 'SLA Warning'
    case 'sla_breach': return 'SLA Breached'
    default: return 'Notification'
  }
}

// GET /api/notifications — list for current user
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: deriveTitle(n.type),
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
