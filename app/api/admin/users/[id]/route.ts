import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ==========================================
// DELETE /api/admin/users/[id] — Remove staff
// ==========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Re-enable admin auth check before production

    const { id } = await params

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transaction: unassign complaints, add timeline, delete user
    await prisma.$transaction(async (tx) => {
      // Get all actively assigned complaints
      const assignedComplaints = await tx.complaint.findMany({
        where: {
          assignedOfficerId: id,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
        select: { id: true },
      })

      // Unassign complaints and set to PENDING
      if (assignedComplaints.length > 0) {
        await tx.complaint.updateMany({
          where: {
            assignedOfficerId: id,
            status: { notIn: ['RESOLVED', 'CLOSED'] },
          },
          data: {
            assignedOfficerId: null,
            status: 'PENDING',
          },
        })

        // Add timeline entries for each unassigned complaint
        await tx.complaintTimeline.createMany({
          data: assignedComplaints.map((c) => ({
            complaintId: c.id,
            status: 'PENDING',
            message: `Officer ${user.name} removed from system. Complaint unassigned and set to Pending.`,
          })),
        })
      }

      // Delete user's notifications
      await tx.notification.deleteMany({ where: { userId: id } })

      // Delete user's feedback
      await tx.feedback.deleteMany({ where: { citizenId: id } })

      // Delete user's upvotes
      await tx.complaintUpvote.deleteMany({ where: { userId: id } })

      // Clear department head reference if this user is a dept head
      await tx.department.updateMany({
        where: { headId: id },
        data: { headId: null },
      })

      // Finally delete the user
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: `User ${user.name} deleted` })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
