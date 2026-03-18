'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import { MOCK_COMPLAINTS } from '@/lib/mock-data'
import { Plus, Search, MapPin, ThumbsUp, Calendar, Star, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ComplaintStatus } from '@/types'

type FilterStatus = ComplaintStatus | 'all'

export default function MyComplaintsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  const filteredComplaints = useMemo(() => {
    let complaints = [...MOCK_COMPLAINTS]

    // Filter by search
    if (search) {
      complaints = complaints.filter(c =>
        c.displayId.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.location.address.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      complaints = complaints.filter(c => c.status === statusFilter)
    }

    // Sort
    complaints.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

    return complaints
  }, [search, statusFilter, sortBy])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_COMPLAINTS.length }
    MOCK_COMPLAINTS.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
          <p className="text-muted-foreground">{filteredComplaints.length} complaints</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/citizen/complaints/new">
            <Plus className="h-4 w-4" />
            New Complaint
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="gap-1">
              All <span className="text-muted-foreground">({statusCounts.all || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              Pending <span className="text-muted-foreground">({statusCounts.pending || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-1">
              In Progress <span className="text-muted-foreground">({statusCounts.in_progress || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="gap-1">
              Resolved <span className="text-muted-foreground">({statusCounts.resolved || 0})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <CategoryIcon icon={complaint.category.icon} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={complaint.status} />
                        <span className="font-mono text-sm text-muted-foreground">
                          {complaint.displayId}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">
                        {complaint.category.name} {'>'} {complaint.subcategory.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {complaint.location.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Filed {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {complaint.upvotes} upvotes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <PriorityBadge priority={complaint.priority} />
                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                      <SLATimer 
                        deadline={complaint.slaDeadline}
                        breached={complaint.slaBreached}
                        remainingHours={complaint.slaRemainingHours}
                      />
                    )}
                    <div className="flex gap-2 mt-2">
                      {complaint.status === 'resolved' && !complaint.rating && (
                        <Button size="sm" variant="outline" className="gap-1">
                          <Star className="h-4 w-4" />
                          Rate
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild className="gap-1">
                        <Link href={`/citizen/complaints/${complaint.id}`}>
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-foreground">No complaints found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'File your first complaint to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/citizen/complaints/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Complaint
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
