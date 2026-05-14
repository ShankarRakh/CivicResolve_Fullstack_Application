import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ==========================================
// GET /api/admin/stats — Admin dashboard stats
// Minimal queries to stay within Supabase pool limits
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable admin auth check before production

    // ── 1. Status counts (single query) ──
    const statusGroups = await prisma.complaint.groupBy({
      by: ['status'],
      _count: true,
    })

    const counts: Record<string, number> = { total: 0 }
    for (const group of statusGroups) {
      counts[group.status] = group._count
      counts.total += group._count
    }

    // ── 2. SLA breached ──
    const slaBreached = await prisma.complaint.count({
      where: {
        slaDeadline: { lt: new Date() },
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    })
    counts['SLA_BREACHED'] = slaBreached

    // ── 3. Category distribution (single query) ──
    const categoryGroups = await prisma.complaint.groupBy({
      by: ['categoryId'],
      _count: true,
    })

    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const categoryDistribution = categoryGroups.map((g) => ({
      categoryId: g.categoryId,
      categoryName: categoryMap.get(g.categoryId) || g.categoryId,
      count: g._count,
    }))

    // ── 4. Recent complaints (single query) ──
    const recentComplaints = await prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        department: { select: { id: true, name: true } },
        assignedOfficer: { select: { id: true, name: true } },
        citizen: { select: { id: true, name: true } },
      },
    })

    // ── Response ──
    return NextResponse.json({
      counts,
      categoryDistribution,
      recentComplaints: recentComplaints.map((c) => ({
        id: c.id,
        displayId: c.displayId,
        description: c.description,
        status: c.status,
        priority: c.priority,
        address: c.address,
        categoryId: c.categoryId,
        categoryName: c.category?.name ?? null,
        categoryIcon: c.category?.icon ?? null,
        departmentName: c.department?.name ?? null,
        assignedOfficerName: c.assignedOfficer?.name ?? null,
        citizenName: c.citizen?.name ?? null,
        slaDeadline: c.slaDeadline?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      departmentPerformance: [],
      topOfficers: [],
    })
  } catch (error) {
    console.error('GET /api/admin/stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
