'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api-client'
import { resolveCategory } from '@/lib/resolve-category'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  Plus,
  ArrowRight,
  MapPin,
  Megaphone,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Stats {
  total: number
  pending: number
  inProgress: number
  resolved: number
}

interface ComplaintItem {
  id: string
  displayId: string
  description: string
  categoryId: string
  subcategoryId: string
  status: string
  priority: string
  address: string | null
  wardName: string | null
  wardZone: string | null
  slaDeadline: string | null
  createdAt: string
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentComplaints, setRecentComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, complaintsData] = await Promise.all([
          apiFetch<Stats>('/api/complaints/stats'),
          apiFetch<{ items: ComplaintItem[] }>('/api/complaints?limit=3'),
        ])
        setStats(statsData)
        setRecentComplaints(complaintsData.items)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Your civic complaint dashboard</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/citizen/complaints/new">
            <Plus className="h-5 w-5" />
            New Complaint
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Complaints"
          value={stats?.total ?? 0}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Pending"
          value={stats?.pending ?? 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress ?? 0}
          icon={RefreshCw}
          variant="default"
        />
        <StatCard
          title="Resolved"
          value={stats?.resolved ?? 0}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Complaints</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/citizen/complaints" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentComplaints.length > 0 ? (
            recentComplaints.map((complaint) => {
              const cat = resolveCategory(complaint.categoryId, complaint.subcategoryId)
              return (
                <Link
                  key={complaint.id}
                  href={`/citizen/complaints/${complaint.id}`}
                  className="block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <CategoryIcon icon={cat.categoryIcon} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            {complaint.displayId}
                          </span>
                          <StatusBadge status={complaint.status} />
                          <PriorityBadge priority={complaint.priority} />
                        </div>
                        <p className="font-medium text-foreground">
                          {cat.categoryName} {'>'} {cat.subcategoryName}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {complaint.wardName ?? 'Ward unknown'}
                          </span>
                          <span>
                            Filed {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      {complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && complaint.slaDeadline && (
                        <SLATimer deadline={complaint.slaDeadline} />
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium text-foreground">No complaints yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                File your first complaint to get started
              </p>
              <Button asChild className="mt-4">
                <Link href="/citizen/complaints/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Complaint
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ward Info & Announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ward Stats — placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Ward</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6 text-muted-foreground">
            <p>Ward stats coming soon.</p>
          </CardContent>
        </Card>

        {/* Announcements — placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-4">
              No announcements
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
