import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'

// GET /api/complaints/stats — counts by status for current citizen
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where = { citizenId: payload.userId }

    const [total, pending, assigned, inProgress, resolved, rejected, closed] =
      await Promise.all([
        prisma.complaint.count({ where }),
        prisma.complaint.count({ where: { ...where, status: 'PENDING' } }),
        prisma.complaint.count({ where: { ...where, status: 'ASSIGNED' } }),
        prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } }),
        prisma.complaint.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.complaint.count({ where: { ...where, status: 'CLOSED' } }),
      ])

    return NextResponse.json({
      total,
      pending,
      assigned,
      inProgress,
      resolved,
      rejected,
      closed,
    })
  } catch (error) {
    console.error('GET /api/complaints/stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
