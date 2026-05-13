"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone,
  Mail,
  Camera,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  History,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { CategoryIcon } from "@/components/common/category-icon"
import { CATEGORIES, COMPLAINT_STATUSES } from "@/lib/constants"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

// Resolve category/subcategory info from the CATEGORIES constant
function resolveCategory(categoryId: string) {
  return CATEGORIES.find(c => c.id === categoryId)
}
function resolveSubcategory(categoryId: string, subcategoryId: string) {
  const cat = resolveCategory(categoryId)
  return cat?.subcategories?.find(s => s.id === subcategoryId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComplaintDetail = any

export default function OfficerComplaintDetailPage() {
  const params = useParams()
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [note, setNote] = useState("")
  const [newStatus, setNewStatus] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")

  const fetchComplaint = useCallback(async () => {
    try {
      const data = await apiFetch<ComplaintDetail>(`/api/complaints/${params.id}`)
      setComplaint(data)
    } catch (err) {
      console.error('Failed to fetch complaint:', err)
      setComplaint(null)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchComplaint()
  }, [fetchComplaint])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Complaint not found</h2>
        <p className="text-muted-foreground mb-4">The complaint you&apos;re looking for doesn&apos;t exist or isn&apos;t assigned to you.</p>
        <Button asChild>
          <Link href="/officer/queue">Back to Queue</Link>
        </Button>
      </div>
    )
  }

  const cat = resolveCategory(complaint.categoryId)
  const subcat = resolveSubcategory(complaint.categoryId, complaint.subcategoryId)
  const complaintTitle = (complaint.categoryName || cat?.name || 'Unknown') + " — " + (subcat?.name || complaint.subcategoryId)

  const handleAddNote = async () => {
    if (!note.trim()) return
    setIsSubmitting(true)
    try {
      await apiFetch(`/api/complaints/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: complaint.status, message: note.trim() }),
      })
      toast.success("Note added successfully")
      setNote("")
      await fetchComplaint() // Refresh to show new timeline entry
    } catch (err) {
      toast.error("Failed to add note")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setIsSubmitting(true)
    try {
      await apiFetch(`/api/complaints/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Status updated to ${newStatus}`)
      setNewStatus("")
      await fetchComplaint() // Refresh
    } catch (err) {
      toast.error("Failed to update status")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolve = async () => {
    setIsSubmitting(true)
    try {
      await apiFetch(`/api/complaints/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'RESOLVED', message: resolutionNote }),
      })
      toast.success("Complaint marked as resolved")
      setShowResolveDialog(false)
      setResolutionNote("")
      await fetchComplaint() // Refresh
    } catch (err) {
      toast.error("Failed to resolve complaint")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/officer/queue">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{complaint.displayId}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {complaintTitle}
          </p>
        </div>
        <div className="flex gap-2">
          {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && complaint.status !== "REJECTED" && (
            <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
              <DialogTrigger asChild>
                <Button className="bg-success hover:bg-success/90 text-success-foreground">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolve Complaint</DialogTitle>
                  <DialogDescription>
                    Please provide a resolution summary before marking this complaint as resolved.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Describe how the issue was resolved..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleResolve} 
                    disabled={!resolutionNote.trim() || isSubmitting}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {isSubmitting ? "Resolving..." : "Confirm Resolution"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint details */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <CategoryIcon icon={complaint.categoryIcon || cat?.icon || 'MoreHorizontal'} size="lg" />
                <div className="flex-1">
                  <CardTitle>
                    {complaintTitle}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Filed on {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{complaint.description}</p>
              </div>

              {complaint.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{complaint.address}</span>
                  {complaint.wardName && (
                    <span className="text-muted-foreground">({complaint.wardName})</span>
                  )}
                </div>
              )}

              {complaint.images && complaint.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {complaint.images.map((url: string, idx: number) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        {url && url !== '/placeholder.svg' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={`Attachment ${idx + 1}`} className="object-cover w-full h-full" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity tabs */}
          <Card>
            <Tabs defaultValue="timeline">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="timeline">
                    <History className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="timeline" className="mt-0">
                  <div className="space-y-4">
                    {complaint.timeline && complaint.timeline.length > 0 ? (
                      complaint.timeline.map((event: { id: string; status: string; message: string; createdAt: string }, idx: number) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="relative">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              event.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                              event.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                              event.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              event.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {event.status === 'RESOLVED' && <CheckCircle2 className="h-4 w-4" />}
                              {event.status === 'ASSIGNED' && <User className="h-4 w-4" />}
                              {event.status === 'IN_PROGRESS' && <MessageSquare className="h-4 w-4" />}
                              {event.status === 'PENDING' && <FileText className="h-4 w-4" />}
                              {event.status === 'REJECTED' && <AlertTriangle className="h-4 w-4" />}
                            </div>
                            {idx < complaint.timeline.length - 1 && (
                              <div className="absolute left-4 top-8 bottom-0 w-px bg-border h-full" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">{event.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No timeline entries yet</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Add a note or update..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="flex-1"
                      />
                    </div>
                    <Button 
                      onClick={handleAddNote} 
                      disabled={!note.trim() || isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SLA Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA Status</CardTitle>
            </CardHeader>
            <CardContent>
              {complaint.slaDeadline ? (
                <>
                  <SLATimer deadline={complaint.slaDeadline} showProgress />
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SLA Deadline</span>
                      <span>{new Date(complaint.slaDeadline).toLocaleDateString()}</span>
                    </div>
                    {subcat && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category SLA</span>
                        <span>{subcat.slaHours} hours</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No SLA deadline set</p>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && complaint.status !== "REJECTED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_STATUSES.filter(s => s.id !== "RESOLVED" && s.id !== "CLOSED" && s.id !== complaint.status).map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={!newStatus || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Updating..." : "Update Status"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Citizen Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Citizen Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{complaint.citizenName?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{complaint.citizenName || "Citizen"}</p>
                  {complaint.wardName && (
                    <p className="text-sm text-muted-foreground">{complaint.wardName}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                {complaint.citizenPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{complaint.citizenPhone}</span>
                  </div>
                )}
                {complaint.citizenEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{complaint.citizenEmail}</span>
                  </div>
                )}
              </div>
              {complaint.citizenPhone && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${complaint.citizenPhone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Citizen
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
