"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Mail,
  Camera,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  History
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { MOCK_COMPLAINTS, MOCK_TIMELINE, MOCK_USERS } from "@/lib/mock-data"
import { COMPLAINT_STATUSES } from "@/lib/constants"
import { toast } from "sonner"

export default function OfficerComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [note, setNote] = useState("")
  const [newStatus, setNewStatus] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")

  const complaint = MOCK_COMPLAINTS.find(c => c.id === params.id)
  const citizen = MOCK_USERS.find(u => u.id === complaint?.citizenId)

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Complaint not found</h2>
        <p className="text-muted-foreground mb-4">The complaint you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/officer/queue">Back to Queue</Link>
        </Button>
      </div>
    )
  }

  const handleAddNote = async () => {
    if (!note.trim()) return
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success("Note added successfully")
    setNote("")
    setIsSubmitting(false)
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success(`Status updated to ${newStatus}`)
    setNewStatus("")
    setIsSubmitting(false)
  }

  const handleResolve = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Complaint marked as resolved")
    setShowResolveDialog(false)
    setIsSubmitting(false)
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
            <h1 className="text-xl font-bold">{complaint.id}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
          </p>
        </div>
        <div className="flex gap-2">
          {complaint.status !== "resolved" && (
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
                <CategoryIcon icon={complaint.category.icon} size="lg" />
                <div className="flex-1">
                  <CardTitle>
                    {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
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

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{complaint.location.address}</span>
                <span className="text-muted-foreground">({complaint.location.ward})</span>
              </div>

              {complaint.attachments && complaint.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {complaint.attachments.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
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
                    {MOCK_TIMELINE.map((event, idx) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            event.type === "status_change" ? "bg-primary/10 text-primary" :
                            event.type === "assignment" ? "bg-secondary/10 text-secondary" :
                            "bg-muted"
                          }`}>
                            {event.type === "status_change" && <CheckCircle2 className="h-4 w-4" />}
                            {event.type === "assignment" && <User className="h-4 w-4" />}
                            {event.type === "note" && <MessageSquare className="h-4 w-4" />}
                            {event.type === "created" && <FileText className="h-4 w-4" />}
                          </div>
                          {idx < MOCK_TIMELINE.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-border h-full" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.user} - {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
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
              <SLATimer deadline={complaint.slaDeadline} showProgress />
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Deadline</span>
                  <span>{new Date(complaint.slaDeadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category SLA</span>
                  <span>{complaint.category.id === "roads" ? "48 hours" : complaint.category.id === "water" ? "24 hours" : "72 hours"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Status */}
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
                  {COMPLAINT_STATUSES.filter(s => s.id !== "resolved").map(status => (
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
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Citizen Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Citizen Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={citizen?.avatar} />
                  <AvatarFallback>{citizen?.name?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{citizen?.name || "Citizen"}</p>
                  <p className="text-sm text-muted-foreground">{complaint.location.ward}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{citizen?.phone || "+91 98765 43210"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{citizen?.email || "citizen@email.com"}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Contact Citizen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
