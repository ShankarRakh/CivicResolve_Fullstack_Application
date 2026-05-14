import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'
import { z } from 'zod'

// Validation schema
const statusUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'RESOLVED', 'REJECTED', 'PENDING']),
  message: z.string().optional().default(''),
  resolvedImage: z.string().url().optional().or(z.literal('')),
})

// PATCH /api/complaints/[id]/status — officer updates complaint status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check — officer only
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'OFFICER') {
      return NextResponse.json({ error: 'Forbidden — officers only' }, { status: 403 })
    }

    const { id } = await params

    // 2. Parse body
    const body = await request.json()
    const parsed = statusUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, message, resolvedImage } = parsed.data

    // 3. Verify complaint exists and is assigned to this officer
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      select: { id: true, displayId: true, citizenId: true, assignedOfficerId: true, status: true },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }
    if (complaint.assignedOfficerId !== payload.userId) {
      return NextResponse.json({ error: 'This complaint is not assigned to you' }, { status: 403 })
    }

    // 4. Build a human-readable timeline message
    const statusLabels: Record<string, string> = {
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
      REJECTED: 'Rejected',
    }
    const timelineMessage = message
      ? `Status changed to ${statusLabels[status]}. ${message}`
      : `Status changed to ${statusLabels[status]}.`

    // 5. Transaction: update status + create timeline + create notification
    const updated = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: { 
          status,
          ...(resolvedImage && { resolvedImage })
        },
      })

      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          status,
          message: timelineMessage,
        },
      })

      // Notify the citizen
      await tx.notification.create({
        data: {
          userId: complaint.citizenId,
          type: 'status_update',
          message: `Your complaint ${complaint.displayId} has been updated to ${statusLabels[status]}.`,
        },
      })

      return updatedComplaint
    })

    return NextResponse.json({
      id: updated.id,
      displayId: updated.displayId,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('PATCH /api/complaints/[id]/status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
