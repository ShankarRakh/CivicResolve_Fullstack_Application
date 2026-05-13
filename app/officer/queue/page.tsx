"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  SortAsc,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { CategoryIcon } from "@/components/common/category-icon"
import { CATEGORIES } from "@/lib/constants"
import { apiFetch } from "@/lib/api-client"

// Resolve category/subcategory info from the CATEGORIES constant
function resolveCategory(categoryId: string) {
  return CATEGORIES.find(c => c.id === categoryId)
}
function resolveSubcategory(categoryId: string, subcategoryId: string) {
  const cat = resolveCategory(categoryId)
  return cat?.subcategories?.find(s => s.id === subcategoryId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Complaint = any

export default function OfficerQueuePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"sla" | "priority" | "date">("sla")

  useEffect(() => {
    async function fetchComplaints() {
      setIsLoading(true)
      try {
        const res = await apiFetch<{ items: Complaint[] }>('/api/complaints')
        setComplaints(res.items)
      } catch (err) {
        console.error('Failed to fetch complaints:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchComplaints()
  }, [])

  // Apply filters
  let filteredComplaints = complaints.filter(complaint => {
    const search = searchQuery.toLowerCase()
    const cat = resolveCategory(complaint.categoryId)
    const subcat = resolveSubcategory(complaint.categoryId, complaint.subcategoryId)
    const title = (cat?.name || '') + ' ' + (subcat?.name || '') + ' ' + complaint.description
    const matchesSearch =
      title.toLowerCase().includes(search) ||
      complaint.displayId.toLowerCase().includes(search) ||
      (complaint.address || '').toLowerCase().includes(search)

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(complaint.categoryId)

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Sort complaints
  filteredComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortBy === "sla") {
      const aDeadline = a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity
      const bDeadline = b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity
      return aDeadline - bDeadline
    } else if (sortBy === "priority") {
      const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4) 
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const pendingCount = complaints.filter(c => c.status === "PENDING" || c.status === "ASSIGNED").length
  const inProgressCount = complaints.filter(c => c.status === "IN_PROGRESS").length
  const resolvedCount = complaints.filter(c => c.status === "RESOLVED").length

  // Shared complaint list renderer
  const renderComplaintList = (items: Complaint[]) => (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.length > 0 ? (
            items.map((complaint: Complaint) => {
              const cat = resolveCategory(complaint.categoryId)
              const subcat = resolveSubcategory(complaint.categoryId, complaint.subcategoryId)
              return (
                <Link
                  key={complaint.id}
                  href={`/officer/queue/${complaint.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <CategoryIcon icon={complaint.categoryIcon || cat?.icon || 'MoreHorizontal'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {(complaint.categoryName || cat?.name || 'Unknown') + " — " + (subcat?.name || complaint.subcategoryId)}
                          </p>
                          <PriorityBadge priority={complaint.priority} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {complaint.displayId}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                      {complaint.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <StatusBadge status={complaint.status} />
                      {complaint.slaDeadline && <SLATimer deadline={complaint.slaDeadline} compact />}
                      {complaint.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {complaint.address}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No complaints found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || categoryFilter.length > 0 
                  ? "Try adjusting your filters"
                  : "Your queue is empty. Great work!"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Queue</h1>
        <p className="text-muted-foreground">
          Manage and resolve complaints assigned to you
        </p>
      </div>

      {/* Status tabs */}
      <Tabs defaultValue="all" className="space-y-4" onValueChange={(v) => setStatusFilter(v === "all" ? "all" : v)}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              All ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="PENDING" onClick={() => setStatusFilter("PENDING")}>
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" onClick={() => setStatusFilter("IN_PROGRESS")}>
              In Progress ({inProgressCount})
            </TabsTrigger>
            <TabsTrigger value="RESOLVED" onClick={() => setStatusFilter("RESOLVED")}>
              Resolved ({resolvedCount})
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CATEGORIES.map((category) => (
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

            <Select value={sortBy} onValueChange={(v: "sla" | "priority" | "date") => setSortBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sla">SLA Deadline</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="date">Date Filed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {renderComplaintList(filteredComplaints)}
        </TabsContent>

        <TabsContent value="PENDING" className="mt-0">
          {renderComplaintList(filteredComplaints)}
        </TabsContent>

        <TabsContent value="IN_PROGRESS" className="mt-0">
          {renderComplaintList(filteredComplaints)}
        </TabsContent>

        <TabsContent value="RESOLVED" className="mt-0">
          {renderComplaintList(filteredComplaints)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
