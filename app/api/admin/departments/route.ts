import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ==========================================
// GET /api/admin/departments — List all departments
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable admin auth check before production

    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('GET /api/admin/departments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
