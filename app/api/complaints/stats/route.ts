import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'

// GET /api/complaints/stats — counts by status for current user (citizen or officer)
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role-aware where clause
    const where =
      payload.role === 'OFFICER'
        ? { assignedOfficerId: payload.userId }
        : { citizenId: payload.userId }

    // Start of today (midnight) for "resolved today" count
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [total, pending, assigned, inProgress, resolved, rejected, closed, resolvedToday, slaBreached] =
      await Promise.all([
        prisma.complaint.count({ where }),
        prisma.complaint.count({ where: { ...where, status: 'PENDING' } }),
        prisma.complaint.count({ where: { ...where, status: 'ASSIGNED' } }),
        prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } }),
        prisma.complaint.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.complaint.count({ where: { ...where, status: 'CLOSED' } }),
        // Resolved today — complaints resolved whose updatedAt is today
        prisma.complaint.count({
          where: {
            ...where,
            status: 'RESOLVED',
            updatedAt: { gte: todayStart },
          },
        }),
        // SLA breached — deadline passed and not yet resolved/closed
        prisma.complaint.count({
          where: {
            ...where,
            slaDeadline: { lt: new Date() },
            status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
          },
        }),
      ])

    return NextResponse.json({
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      rejected,
      closed,
      resolvedToday,
      slaBreached,
    })
  } catch (error) {
    console.error('GET /api/complaints/stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
