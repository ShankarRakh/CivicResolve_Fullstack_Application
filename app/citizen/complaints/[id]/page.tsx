'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { resolveCategory } from '@/lib/resolve-category'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Building2,
  User,
  Share2,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'

interface TimelineEntry {
  id: string
  status: string
  message: string
  createdAt: string
}

interface ComplaintDetail {
  id: string
  displayId: string
  description: string
  categoryId: string
  subcategoryId: string
  status: string
  priority: string
  address: string | null
  latitude: number | null
  longitude: number | null
  wardName: string | null
  wardZone: string | null
  departmentName: string | null
  assignedOfficerName: string | null
  images: string[]
  resolvedImage: string | null
  slaDeadline: string | null
  createdAt: string
  updatedAt: string
  timeline: TimelineEntry[]
}

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const data = await apiFetch<ComplaintDetail>(`/api/complaints/${id}`)
        setComplaint(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load complaint')
      } finally {
        setLoading(false)
      }
    }
    fetchComplaint()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="gap-2 -ml-2">
          <Link href="/citizen/complaints">
            <ArrowLeft className="h-4 w-4" />
            Back to My Complaints
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold text-foreground">Complaint not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cat = resolveCategory(complaint.categoryId, complaint.subcategoryId)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild className="gap-2 -ml-2">
        <Link href="/citizen/complaints">
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono">{complaint.displayId}</h1>
            <StatusBadge status={complaint.status} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CategoryIcon icon={cat.categoryIcon} size="sm" />
            <span>{cat.categoryName} {'>'} {cat.subcategoryName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          {complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && complaint.slaDeadline && (
            <SLATimer deadline={complaint.slaDeadline} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto" />
                  <p className="mt-2 text-sm">Map would appear here</p>
                </div>
              </div>
              <div>
                <p className="font-medium">{complaint.address ?? 'No address provided'}</p>
                <p className="text-sm text-muted-foreground">
                  {complaint.wardName ?? 'Ward unknown'}
                  {complaint.wardZone ? `, ${complaint.wardZone}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{complaint.description}</p>
            </CardContent>
          </Card>

          {/* Photos */}
          {complaint.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Photos ({complaint.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg bg-muted overflow-hidden">
                      <img src={img} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution Proof */}
          {complaint.resolvedImage && (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolution Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden border bg-muted max-w-lg">
                  <img src={complaint.resolvedImage} alt="Resolution proof" className="h-full w-full object-cover" />
                </div>
                <p className="mt-3 text-sm text-emerald-800 font-medium">
                  The officer has marked this issue as resolved and provided the above photo as evidence.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {complaint.timeline.length > 0 ? (
                <div className="space-y-4">
                  {complaint.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        {index < complaint.timeline.length - 1 && (
                          <div className="absolute top-3 h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={event.status} />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.createdAt), 'd MMM, h:mm a')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">{event.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No timeline entries yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department
                </p>
                <p className="font-medium">{complaint.departmentName ?? 'Not assigned'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Officer
                </p>
                <p className="font-medium">{complaint.assignedOfficerName ?? 'Not yet assigned'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filed On
                </p>
                <p className="font-medium">
                  {format(new Date(complaint.createdAt), 'd MMMM yyyy, h:mm a')}
                </p>
              </div>
              {complaint.slaDeadline && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    SLA Deadline
                  </p>
                  <p className="font-medium">
                    {format(new Date(complaint.slaDeadline), 'd MMMM yyyy, h:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
