"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Download,
  MapPin,
  MoreHorizontal,
  UserPlus,
  Eye,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, PRIORITY_LEVELS } from "@/lib/constants"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface Complaint {
  id: string
  displayId: string
  description: string
  categoryId: string
  subcategoryId: string
  status: string
  priority: string
  address: string | null
  departmentName: string | null
  assignedOfficerName: string | null
  assignedOfficerId?: string | null
  departmentId?: string | null
  categoryName: string | null
  categoryIcon: string | null
  slaDeadline: string | null
  createdAt: string
}

interface Officer {
  id: string
  name: string
  email: string
  department: { id: string; name: string } | null
  complaintsCount: number
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([])

  // Reassign state
  const [reassignComplaint, setReassignComplaint] = useState<Complaint | null>(null)
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loadingOfficers, setLoadingOfficers] = useState(false)
  const [reassigning, setReassigning] = useState(false)

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true)
      // Direct fetch without auth token — ensures admin sees ALL complaints
      const res = await fetch("/api/complaints?limit=200")
      if (!res.ok) throw new Error("Failed to load complaints")
      const data = await res.json()
      setComplaints(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  // Fetch officers for reassignment (same department)
  const openReassignDialog = async (complaint: Complaint) => {
    setReassignComplaint(complaint)
    setLoadingOfficers(true)
    try {
      // Fetch officers, optionally filtered by department
      const url = complaint.departmentId 
        ? `/api/admin/users?departmentId=${complaint.departmentId}`
        : '/api/admin/users'
      const data = await apiFetch<{ users: Officer[] }>(url)
      // Filter to only officers (not admins) and exclude current assignee
      const filtered = data.users.filter(
        (u) => u.id !== complaint.assignedOfficerId
      )
      setOfficers(filtered)
    } catch {
      toast.error("Failed to load officers")
      setReassignComplaint(null)
    } finally {
      setLoadingOfficers(false)
    }
  }

  const handleReassign = async (officerId: string) => {
    if (!reassignComplaint) return
    setReassigning(true)
    try {
      const result = await apiFetch<{ assignedOfficerName: string; status: string }>(
        `/api/admin/complaints/${reassignComplaint.id}/reassign`,
        { method: 'PATCH', body: JSON.stringify({ newOfficerId: officerId }) }
      )
      // Optimistic update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === reassignComplaint.id
            ? { ...c, assignedOfficerName: result.assignedOfficerName, status: result.status }
            : c
        )
      )
      toast.success(`Complaint reassigned to ${result.assignedOfficerName}`)
      setReassignComplaint(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reassignment failed")
    } finally {
      setReassigning(false)
    }
  }

  // Apply filters
  const filteredComplaints = complaints.filter(complaint => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      complaint.description.toLowerCase().includes(search) ||
      complaint.displayId.toLowerCase().includes(search) ||
      (complaint.address || "").toLowerCase().includes(search)

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(complaint.categoryId)
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(complaint.priority)

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComplaints(filteredComplaints.map(c => c.id))
    } else {
      setSelectedComplaints([])
    }
  }

  const handleSelectComplaint = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedComplaints([...selectedComplaints, id])
    } else {
      setSelectedComplaints(selectedComplaints.filter(c => c !== id))
    }
  }

  const handleExport = () => {
    toast.success("Exporting complaints data...")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading complaints...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchComplaints}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Complaints</h1>
          <p className="text-muted-foreground">
            Manage and monitor all grievances across the municipality ({complaints.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchComplaints}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {COMPLAINT_STATUSES.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Category
                  {categoryFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {categoryFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COMPLAINT_CATEGORIES.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={categoryFilter.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCategoryFilter([...categoryFilter, category.id])
                      } else {
                        setCategoryFilter(categoryFilter.filter(c => c !== category.id))
                      }
                    }}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Priority
                  {priorityFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {priorityFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PRIORITY_LEVELS.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority.id}
                    checked={priorityFilter.includes(priority.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPriorityFilter([...priorityFilter, priority.id])
                      } else {
                        setPriorityFilter(priorityFilter.filter(p => p !== priority.id))
                      }
                    }}
                  >
                    {priority.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk actions */}
          {selectedComplaints.length > 0 && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedComplaints.length} selected
              </span>
              <Button size="sm" variant="ghost" onClick={() => setSelectedComplaints([])}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedComplaints.length === filteredComplaints.length && filteredComplaints.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Complaint</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || categoryFilter.length > 0
                      ? "No complaints match your filters"
                      : "No complaints found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedComplaints.includes(complaint.id)}
                        onCheckedChange={(checked) => handleSelectComplaint(complaint.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[200px]">
                        <p className="font-medium text-sm truncate max-w-[300px]">
                          {complaint.categoryName} — {complaint.description.slice(0, 50)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{complaint.displayId}</span>
                          {complaint.address && (
                            <>
                              <span>·</span>
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{complaint.address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{complaint.categoryName || complaint.categoryId}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={complaint.priority} />
                    </TableCell>
                    <TableCell>
                      {complaint.slaDeadline ? (
                        <SLATimer deadline={complaint.slaDeadline} compact />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {complaint.assignedOfficerName ? (
                        <span className="text-sm">{complaint.assignedOfficerName}</span>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/complaints/${complaint.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openReassignDialog(complaint)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Reassign Officer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={!!reassignComplaint} onOpenChange={(open) => !open && setReassignComplaint(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Complaint</DialogTitle>
            <DialogDescription>
              {reassignComplaint?.displayId} — Select a new officer
              {reassignComplaint?.departmentName && ` from ${reassignComplaint.departmentName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {loadingOfficers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : officers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No available officers in this department
              </p>
            ) : (
              officers.map((officer) => (
                <button
                  key={officer.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  onClick={() => handleReassign(officer.id)}
                  disabled={reassigning}
                >
                  <div>
                    <p className="font-medium text-sm">{officer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {officer.department?.name || "No department"} · {officer.complaintsCount} active
                    </p>
                  </div>
                  {reassigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
