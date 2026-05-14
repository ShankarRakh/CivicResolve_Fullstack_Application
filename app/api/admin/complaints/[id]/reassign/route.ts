import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reassignSchema = z.object({
  newOfficerId: z.string().min(1, 'Officer ID is required'),
})

// ==========================================
// PATCH /api/admin/complaints/[id]/reassign
// ==========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Re-enable admin auth check before production

    const { id } = await params
    const body = await request.json()
    const parsed = reassignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { newOfficerId } = parsed.data

    // 1. Get the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      select: {
        id: true,
        displayId: true,
        departmentId: true,
        status: true,
        assignedOfficerId: true,
        assignedOfficer: { select: { name: true } },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // 2. Validate the new officer exists and belongs to the same department
    const newOfficer = await prisma.user.findUnique({
      where: { id: newOfficerId },
      select: { id: true, name: true, role: true, departmentId: true },
    })

    if (!newOfficer || newOfficer.role !== 'OFFICER') {
      return NextResponse.json({ error: 'Invalid officer' }, { status: 400 })
    }

    if (complaint.departmentId && newOfficer.departmentId !== complaint.departmentId) {
      return NextResponse.json(
        { error: 'Officer must belong to the same department as the complaint' },
        { status: 400 }
      )
    }

    // 3. Update complaint + add timeline entry in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          assignedOfficerId: newOfficerId,
          status: complaint.status === 'PENDING' ? 'ASSIGNED' : complaint.status,
        },
        include: {
          assignedOfficer: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      })

      const previousOfficer = complaint.assignedOfficer?.name || 'Unassigned'
      await tx.complaintTimeline.create({
        data: {
          complaintId: id,
          status: updatedComplaint.status,
          message: `Reassigned from ${previousOfficer} to ${newOfficer.name} by Admin`,
        },
      })

      // Notify the new officer
      await tx.notification.create({
        data: {
          userId: newOfficerId,
          type: 'assignment',
          message: `Complaint ${complaint.displayId} has been assigned to you.`,
        },
      })

      return updatedComplaint
    })

    return NextResponse.json({
      id: updated.id,
      displayId: updated.displayId,
      status: updated.status,
      assignedOfficerId: updated.assignedOfficerId,
      assignedOfficerName: updated.assignedOfficer?.name ?? null,
      departmentName: updated.department?.name ?? null,
    })
  } catch (error) {
    console.error('PATCH /api/admin/complaints/[id]/reassign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
