import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthPayload } from '@/lib/api-auth'
import { CATEGORIES } from '@/lib/constants'
import { findNearestWardId } from '@/lib/geo'
import { z } from 'zod'
import { generateEmbedding } from '@/lib/gemini'

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

    // 4. Generate displayId
    const displayId = await generateDisplayId()

    // 4. Generate AI embedding for duplicate detection
    let embeddingValues: number[] | null = null;
    try {
      embeddingValues = await generateEmbedding(data.description, false);
    } catch (e) {
      console.warn("Failed to generate embedding for new complaint, proceeding without it", e);
    }

    // 4. Generate SLA deadline
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

    // 4.6 Auto-assign department + officer based on category
    //     Map category IDs to department IDs in the database
    const CATEGORY_TO_DEPT: Record<string, string> = {
      water: 'dept-water',
      roads: 'dept-roads',
      garbage: 'dept-sanitation',
      lights: 'dept-electrical',
      drainage: 'dept-water',
      health: 'dept-health',
      trees: 'dept-sanitation',
      building: 'dept-roads',
      encroachment: 'dept-sanitation',
      other: 'dept-roads',
    }

    const departmentId = CATEGORY_TO_DEPT[data.categoryId] || null
    let assignedOfficerId: string | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let officers: any[] = []

    if (departmentId) {
      // Pick the officer in this department with the fewest active complaints (load-balancing)
      officers = await prisma.user.findMany({
        where: { departmentId, role: 'OFFICER' },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              complaintsAssigned: {
                where: { status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } }
              }
            }
          }
        },
      })

      if (officers.length > 0) {
        // Sort by fewest active complaints
        officers.sort((a, b) => a._count.complaintsAssigned - b._count.complaintsAssigned)
        assignedOfficerId = officers[0].id
      }
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
          departmentId,
          assignedOfficerId,
          status: assignedOfficerId ? 'ASSIGNED' : 'PENDING',
        },
      })

      // Add the pgvector embedding using a raw query (since Unsupported types cannot be set in Prisma create)
      if (embeddingValues) {
        await tx.$executeRaw`
          UPDATE complaints
          SET embedding = ${embeddingValues}::vector
          WHERE id = ${newComplaint.id}
        `;
      }

      // Timeline entry: "Complaint submitted"
      await tx.complaintTimeline.create({
        data: {
          complaintId: newComplaint.id,
          status: 'PENDING',
          message: 'Complaint submitted',
        },
      })

      // If auto-assigned, add an assignment timeline entry
      if (assignedOfficerId) {
        const officer = officers.find(o => o.id === assignedOfficerId)
        await tx.complaintTimeline.create({
          data: {
            complaintId: newComplaint.id,
            status: 'ASSIGNED',
            message: `Complaint auto-assigned to ${officer?.name || 'an officer'}`,
          },
        })
      }

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

    // Role-aware where clause
    const where =
      payload.role === 'OFFICER'
        ? { assignedOfficerId: payload.userId }
        : { citizenId: payload.userId }

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: sort as 'asc' | 'desc' },
        skip: offset,
        take: limit,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          ward: { select: { id: true, name: true, zone: true } },
          department: { select: { id: true, name: true } },
          assignedOfficer: { select: { id: true, name: true } },
          citizen: { select: { id: true, name: true, phone: true, email: true } },
          timeline: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.complaint.count({ where }),
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
        citizenId: c.citizenId,
        citizenName: c.citizen?.name ?? null,
        citizenPhone: c.citizen?.phone ?? null,
        citizenEmail: c.citizen?.email ?? null,
        categoryName: c.category?.name ?? null,
        categoryIcon: c.category?.icon ?? null,
        images: c.images,
        slaDeadline: c.slaDeadline?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        timeline: c.timeline.map((t) => ({
          id: t.id,
          status: t.status,
          message: t.message,
          createdAt: t.createdAt.toISOString(),
        })),
      })),
      total,
    })
  } catch (error) {
    console.error('GET /api/complaints error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}