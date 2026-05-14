import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// ==========================================
// GET /api/admin/users — List staff (OFFICER + ADMIN)
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable admin auth check before production

    const url = new URL(request.url)
    const departmentId = url.searchParams.get('departmentId')

    const where: Record<string, unknown> = {
      role: { in: ['OFFICER', 'ADMIN'] },
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: { complaintsAssigned: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        department: u.department,
        complaintsCount: u._count.complaintsAssigned,
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ==========================================
// POST /api/admin/users — Create new officer/admin
// ==========================================

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  departmentId: z.string().optional(),
  role: z.enum(['OFFICER', 'ADMIN']),
})

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable admin auth check before production

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for duplicate email or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === data.email ? 'Email already exists' : 'Phone already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId || null,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
