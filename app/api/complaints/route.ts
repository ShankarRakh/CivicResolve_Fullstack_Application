import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'
import { CATEGORIES } from '@/lib/constants'
import { findNearestWardId } from '@/lib/geo'
import { z } from 'zod'

// ==========================================
// Validation schema
// ==========================================

const createComplaintSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().min(1, 'Subcategory is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  address: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  wardId: z.string().optional(),
  images: z.array(z.string().min(1)).max(5, 'Maximum 5 images allowed').default([]),
})

// ==========================================
// Generate displayId: CR-YYYY-XXXXX
// ==========================================

async function generateDisplayId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CR-${year}-`

  // Find the latest complaint for this year
  const latest = await prisma.complaint.findFirst({
    where: { displayId: { startsWith: prefix } },
    orderBy: { displayId: 'desc' },
    select: { displayId: true },
  })

  let nextNumber = 1
  if (latest) {
    const lastNumber = parseInt(latest.displayId.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`
}

// ==========================================
// Get SLA hours from subcategory config
// ==========================================

function getSlaHours(categoryId: string, subcategoryId: string): number {
  const category = CATEGORIES.find((c) => c.id === categoryId)
  if (!category) return 72 // fallback

  const subcategory = category.subcategories?.find((s) => s.id === subcategoryId)
  return subcategory?.slaHours ?? 72 // fallback
}

// ==========================================
// POST /api/complaints
// ==========================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await request.json()
    const parsed = createComplaintSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // 3. Validate categoryId and subcategoryId exist in config
    const category = CATEGORIES.find((c) => c.id === data.categoryId)
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const subcategory = category.subcategories?.find((s) => s.id === data.subcategoryId)
    if (!subcategory) {
      return NextResponse.json({ error: 'Invalid subcategory' }, { status: 400 })
    }

    // 4. Generate displayId and compute SLA deadline
    const displayId = await generateDisplayId()
    const slaHours = getSlaHours(data.categoryId, data.subcategoryId)
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000)

    // 4.5 Auto-assign ward if missing but lat/lng provided
    let finalWardId = data.wardId || null
    if (!finalWardId && data.latitude && data.longitude) {
      const wards = await prisma.ward.findMany({
        select: { id: true, centerLat: true, centerLng: true }
      })
      
      const parsedWards = wards.map(w => ({
        id: w.id,
        centerLat: w.centerLat ? Number(w.centerLat) : null,
        centerLng: w.centerLng ? Number(w.centerLng) : null
      }))
      
      finalWardId = findNearestWardId(data.latitude, data.longitude, parsedWards)
    }

    // 5. Create complaint + timeline entry in a transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          displayId,
          citizenId: payload.userId,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId,
          description: data.description,
          priority: data.priority,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          wardId: finalWardId,
          images: data.images,
          slaDeadline,
        },
      })

      // Timeline entry: "Complaint submitted"
      await tx.complaintTimeline.create({
        data: {
          complaintId: newComplaint.id,
          status: 'PENDING',
          message: 'Complaint submitted',
        },
      })

      // In-app notification for citizen
      await tx.notification.create({
        data: {
          userId: payload.userId,
          type: 'status_update',
          message: `Your complaint ${displayId} has been submitted successfully.`,
        },
      })

      return newComplaint
    })

    // 6. Return response matching the technical plan
    return NextResponse.json(
      {
        id: complaint.id,
        displayId: complaint.displayId,
        status: complaint.status,
        slaDeadline: complaint.slaDeadline?.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/complaints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ==========================================
// GET /api/complaints — list for current citizen
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const sort = url.searchParams.get('sort') === 'oldest' ? 'asc' : 'desc'

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where: { citizenId: payload.userId },
        orderBy: { createdAt: sort as 'asc' | 'desc' },
        skip: offset,
        take: limit,
        include: {
          ward: { select: { id: true, name: true, zone: true } },
          department: { select: { id: true, name: true } },
          assignedOfficer: { select: { id: true, name: true } },
        },
      }),
      prisma.complaint.count({ where: { citizenId: payload.userId } }),
    ])

    return NextResponse.json({
      items: items.map((c) => ({
        id: c.id,
        displayId: c.displayId,
        description: c.description,
        categoryId: c.categoryId,
        subcategoryId: c.subcategoryId,
        status: c.status,
        priority: c.priority,
        address: c.address,
        latitude: c.latitude ? Number(c.latitude) : null,
        longitude: c.longitude ? Number(c.longitude) : null,
        wardId: c.wardId,
        wardName: c.ward?.name ?? null,
        wardZone: c.ward?.zone ?? null,
        departmentName: c.department?.name ?? null,
        assignedOfficerName: c.assignedOfficer?.name ?? null,
        images: c.images,
        slaDeadline: c.slaDeadline?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
    })
  } catch (error) {
    console.error('GET /api/complaints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
