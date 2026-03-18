"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  SortAsc,
  MapPin,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { MOCK_COMPLAINTS } from "@/lib/mock-data"
import { CATEGORIES } from "@/lib/constants"

export default function OfficerQueuePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"sla" | "priority" | "date">("sla")

  // Filter complaints assigned to officer
  const assignedComplaints = MOCK_COMPLAINTS.filter(c => c.assignedOfficerId === "officer-1")

  // Apply filters
  let filteredComplaints = assignedComplaints.filter(complaint => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      (complaint.title ?? complaint.description).toLowerCase().includes(search) ||
      complaint.displayId.toLowerCase().includes(search) ||
      complaint.location.address.toLowerCase().includes(search)

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(complaint.category.id)

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Sort complaints
  filteredComplaints = [...filteredComplaints].sort((a, b) => {
    if (sortBy === "sla") {
      return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime()
    } else if (sortBy === "priority") {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const pendingCount = assignedComplaints.filter(c => c.status === "pending").length
  const inProgressCount = assignedComplaints.filter(c => c.status === "in_progress").length
  const resolvedCount = assignedComplaints.filter(c => c.status === "resolved").length

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
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              All ({assignedComplaints.length})
            </TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setStatusFilter("pending")}>
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="in_progress" onClick={() => setStatusFilter("in_progress")}>
              In Progress ({inProgressCount})
            </TabsTrigger>
            <TabsTrigger value="resolved" onClick={() => setStatusFilter("resolved")}>
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
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => (
                    <Link
                      key={complaint.id}
                      href={`/officer/queue/${complaint.id}`}
                      className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <CategoryIcon icon={complaint.category.icon} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
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
                          <SLATimer deadline={complaint.slaDeadline} compact />
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {complaint.location.address}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
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
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Switch to see pending complaints
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Switch to see in-progress complaints
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                Switch to see resolved complaints
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
