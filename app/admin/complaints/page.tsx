"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  SortAsc,
  Download,
  MapPin,
  Clock,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Eye,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { CategoryIcon } from "@/components/common/category-icon"
import { MOCK_COMPLAINTS, MOCK_OFFICERS } from "@/lib/mock-data"
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, PRIORITY_LEVELS } from "@/lib/constants"
import { toast } from "sonner"

export default function AdminComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([])

  // Apply filters
  const filteredComplaints = MOCK_COMPLAINTS.filter(complaint => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      (complaint.title ?? complaint.description).toLowerCase().includes(search) ||
      complaint.displayId.toLowerCase().includes(search) ||
      complaint.location.address.toLowerCase().includes(search)

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(complaint.category.id)
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

  const handleBulkAssign = () => {
    toast.success(`${selectedComplaints.length} complaints assigned`)
    setSelectedComplaints([])
  }

  const handleExport = () => {
    toast.success("Exporting complaints data...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Complaints</h1>
          <p className="text-muted-foreground">
            Manage and monitor all grievances across the municipality
          </p>
        </div>
        <div className="flex gap-2">
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
                placeholder="Search by ID, title, or location..."
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
              <Button size="sm" variant="outline" onClick={handleBulkAssign}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Officer
              </Button>
              <Button size="sm" variant="outline">
                Change Status
              </Button>
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
              {filteredComplaints.map((complaint) => {
                const officer = MOCK_OFFICERS.find(o => o.id === complaint.assignedOfficerId)
                return (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedComplaints.includes(complaint.id)}
                        onCheckedChange={(checked) => handleSelectComplaint(complaint.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[200px]">
                        <Link
                          href={`/admin/complaints/${complaint.id}`}
                          className="font-medium hover:underline"
                        >
                          {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{complaint.displayId}</span>
                          <span>·</span>
                          <MapPin className="h-3 w-3" />
                          <span>{complaint.location.address}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={complaint.category.icon} size="sm" />
                        <span className="text-sm capitalize">{complaint.category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={complaint.priority} />
                    </TableCell>
                    <TableCell>
                      <SLATimer deadline={complaint.slaDeadline} compact />
                    </TableCell>
                    <TableCell>
                      {officer ? (
                        <span className="text-sm">{officer.name}</span>
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
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Officer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
