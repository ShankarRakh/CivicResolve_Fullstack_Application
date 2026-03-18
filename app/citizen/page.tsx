'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import { MOCK_COMPLAINTS, MOCK_CITIZEN_STATS, MOCK_ANNOUNCEMENTS } from '@/lib/mock-data'
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  Plus,
  ArrowRight,
  MapPin,
  Megaphone,
  Star,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const stats = MOCK_CITIZEN_STATS
  const recentComplaints = MOCK_COMPLAINTS.slice(0, 3)
  const announcements = MOCK_ANNOUNCEMENTS.slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">{user?.ward}, {user?.zone}</p>
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
          value={stats.total}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={RefreshCw}
          variant="default"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
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
            recentComplaints.map((complaint) => (
              <Link 
                key={complaint.id} 
                href={`/citizen/complaints/${complaint.id}`}
                className="block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <CategoryIcon icon={complaint.category.icon} />
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
                        {complaint.category.name} {'>'} {complaint.subcategory.name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {complaint.location.ward}
                        </span>
                        <span>
                          Filed {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    {complaint.status === 'resolved' && !complaint.rating && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Star className="h-4 w-4" />
                        Rate
                      </Button>
                    )}
                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                      <SLATimer 
                        deadline={complaint.slaDeadline}
                        breached={complaint.slaBreached}
                        remainingHours={complaint.slaRemainingHours}
                      />
                    )}
                  </div>
                </div>
              </Link>
            ))
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
        {/* Ward Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Ward - {user?.ward}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Complaints this week</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Resolved this week</span>
              <span className="font-medium text-emerald-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg. resolution time</span>
              <span className="font-medium">2.1 days</span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/feed">View Ward Feed</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(announcement.publishedAt || announcement.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No announcements
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
