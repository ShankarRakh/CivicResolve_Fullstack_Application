'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import { MOCK_COMPLAINTS } from '@/lib/mock-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Building2,
  User,
  ThumbsUp,
  Share2,
  MessageSquare,
  Send,
  Star,
  RotateCcw,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const complaint = MOCK_COMPLAINTS.find(c => c.id === id) || MOCK_COMPLAINTS[0]
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const handleUpvote = () => {
    toast.success('Upvoted!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const handleSendComment = () => {
    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }
    toast.success('Comment sent!')
    setComment('')
  }

  const handleSubmitRating = () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    toast.success('Thank you for your feedback!')
  }

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
            <CategoryIcon icon={complaint.category.icon} size="sm" />
            <span>{complaint.category.name} {'>'} {complaint.subcategory.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
            <SLATimer 
              deadline={complaint.slaDeadline}
              breached={complaint.slaBreached}
              remainingHours={complaint.slaRemainingHours}
            />
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
                <p className="font-medium">{complaint.location.address}</p>
                {complaint.location.landmark && (
                  <p className="text-sm text-muted-foreground">Landmark: {complaint.location.landmark}</p>
                )}
                <p className="text-sm text-muted-foreground">{complaint.location.ward}, {complaint.location.zone}</p>
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
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
                          {format(new Date(event.timestamp), 'd MMM, h:mm a')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{event.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">by {event.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.comments.length > 0 ? (
                <div className="space-y-4">
                  {complaint.comments.map((c) => (
                    <div key={c.id} className={cn(
                      'flex gap-3 p-3 rounded-lg',
                      c.byRole === 'citizen' ? 'bg-muted' : 'bg-primary/5'
                    )}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn(
                          'text-xs',
                          c.byRole === 'citizen' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'
                        )}>
                          {c.by.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.by}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  className="min-h-20"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button size="icon" onClick={handleSendComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rating (if resolved) */}
          {complaint.status === 'resolved' && !complaint.rating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rate Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  How satisfied are you with the resolution?
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Add feedback comment (optional)..." />
                <Button onClick={handleSubmitRating}>Submit Rating</Button>
              </CardContent>
            </Card>
          )}
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
                <p className="font-medium">{complaint.departmentName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Officer
                </p>
                <p className="font-medium">{complaint.assignedOfficerName || 'Not yet assigned'}</p>
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  SLA Deadline
                </p>
                <p className="font-medium">
                  {format(new Date(complaint.slaDeadline), 'd MMMM yyyy, h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleUpvote}
              >
                <ThumbsUp className={cn('h-4 w-4', complaint.hasUpvoted && 'fill-primary text-primary')} />
                Upvote ({complaint.upvotes})
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {complaint.status === 'resolved' && (
                <Button variant="outline" className="w-full gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reopen Complaint
                </Button>
              )}
              {complaint.status === 'pending' && (
                <Button variant="destructive" className="w-full gap-2">
                  <XCircle className="h-4 w-4" />
                  Withdraw Complaint
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
