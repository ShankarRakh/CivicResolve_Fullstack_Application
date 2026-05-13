import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'

// GET /api/complaints/[id] — single complaint detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        ward: { select: { id: true, name: true, zone: true } },
        department: { select: { id: true, name: true } },
        assignedOfficer: { select: { id: true, name: true } },
        citizen: { select: { id: true, name: true, phone: true, email: true } },
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Role-aware access control
    if (payload.role === 'OFFICER') {
      if (complaint.assignedOfficerId !== payload.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // CITIZEN — only their own complaints
      if (complaint.citizenId !== payload.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({
      id: complaint.id,
      displayId: complaint.displayId,
      description: complaint.description,
      categoryId: complaint.categoryId,
      subcategoryId: complaint.subcategoryId,
      status: complaint.status,
      priority: complaint.priority,
      address: complaint.address,
      latitude: complaint.latitude ? Number(complaint.latitude) : null,
      longitude: complaint.longitude ? Number(complaint.longitude) : null,
      wardId: complaint.wardId,
      wardName: complaint.ward?.name ?? null,
      wardZone: complaint.ward?.zone ?? null,
      departmentName: complaint.department?.name ?? null,
      assignedOfficerName: complaint.assignedOfficer?.name ?? null,
      citizenId: complaint.citizenId,
      citizenName: complaint.citizen?.name ?? null,
      citizenPhone: complaint.citizen?.phone ?? null,
      citizenEmail: complaint.citizen?.email ?? null,
      categoryName: complaint.category?.name ?? null,
      categoryIcon: complaint.category?.icon ?? null,
      images: complaint.images,
      slaDeadline: complaint.slaDeadline?.toISOString() ?? null,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      timeline: complaint.timeline.map((t) => ({
        id: t.id,
        status: t.status,
        message: t.message,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/complaints/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}