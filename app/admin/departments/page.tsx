"use client"

import { useState } from "react"
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { StatCard } from "@/components/common/stat-card"
import { MOCK_DEPARTMENTS, MOCK_OFFICERS } from "@/lib/mock-data"
import { toast } from "sonner"

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<(typeof MOCK_DEPARTMENTS)[0] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nameHindi: "",
    email: "",
    contact: "",
    defaultSlaHours: "72",
    headOfficerId: "",
    isActive: true,
  })

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nameHindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalActive = departments.filter((d) => d.isActive).length
  const totalComplaints = departments.reduce((s, d) => s + d.activeComplaints, 0)
  const avgSLA = Math.round(
    departments.reduce((s, d) => s + d.slaCompliance, 0) / departments.length
  )
  const totalOfficers = departments.reduce((s, d) => s + d.officers, 0)

  const openEdit = (dept: (typeof MOCK_DEPARTMENTS)[0]) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      nameHindi: dept.nameHindi,
      email: dept.email,
      contact: dept.contact,
      defaultSlaHours: String(dept.defaultSlaHours),
      headOfficerId: dept.headOfficerId ?? "",
      isActive: dept.isActive,
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Department name and email are required")
      return
    }
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))

    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                name: formData.name,
                nameHindi: formData.nameHindi,
                email: formData.email,
                contact: formData.contact,
                defaultSlaHours: Number(formData.defaultSlaHours),
                headOfficerId: formData.headOfficerId || undefined,
                headOfficerName:
                  MOCK_OFFICERS.find((o) => o.id === formData.headOfficerId)?.name ?? "Vacant",
                isActive: formData.isActive,
              }
            : d
        )
      )
      toast.success("Department updated successfully")
      setEditingDept(null)
    } else {
      const newDept = {
        id: formData.name.toLowerCase().replace(/\s+/g, "_"),
        name: formData.name,
        nameHindi: formData.nameHindi,
        headOfficerId: formData.headOfficerId || undefined,
        headOfficerName:
          MOCK_OFFICERS.find((o) => o.id === formData.headOfficerId)?.name ?? "Vacant",
        contact: formData.contact,
        email: formData.email,
        defaultSlaHours: Number(formData.defaultSlaHours),
        activeComplaints: 0,
        resolvedThisMonth: 0,
        slaCompliance: 100,
        officers: 0,
        isActive: formData.isActive,
      }
      setDepartments((prev) => [...prev, newDept])
      toast.success("Department added successfully")
      setIsAddDialogOpen(false)
    }

    setFormData({
      name: "",
      nameHindi: "",
      email: "",
      contact: "",
      defaultSlaHours: "72",
      headOfficerId: "",
      isActive: true,
    })
    setIsSubmitting(false)
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !current } : d))
    )
    toast.success(`Department ${current ? "deactivated" : "activated"}`)
  }

  const DepartmentForm = () => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dept-name">Department Name *</Label>
          <Input
            id="dept-name"
            placeholder="e.g. Roads Department"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dept-hindi">Name in Hindi / Marathi</Label>
          <Input
            id="dept-hindi"
            placeholder="e.g. Raste Vibhag"
            value={formData.nameHindi}
            onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dept-email">Official Email *</Label>
          <Input
            id="dept-email"
            type="email"
            placeholder="dept@municipality.gov.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dept-contact">Contact Number</Label>
          <Input
            id="dept-contact"
            placeholder="+91 20 2612 0000"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dept-sla">Default SLA (Hours)</Label>
          <Select
            value={formData.defaultSlaHours}
            onValueChange={(v) => setFormData({ ...formData, defaultSlaHours: v })}
          >
            <SelectTrigger id="dept-sla">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 hours (Critical)</SelectItem>
              <SelectItem value="24">24 hours (1 day)</SelectItem>
              <SelectItem value="48">48 hours (2 days)</SelectItem>
              <SelectItem value="72">72 hours (3 days)</SelectItem>
              <SelectItem value="120">120 hours (5 days)</SelectItem>
              <SelectItem value="168">168 hours (7 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dept-head">Department Head</Label>
          <Select
            value={formData.headOfficerId}
            onValueChange={(v) => setFormData({ ...formData, headOfficerId: v })}
          >
            <SelectTrigger id="dept-head">
              <SelectValue placeholder="Select officer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Vacant</SelectItem>
              {MOCK_OFFICERS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="dept-active"
          checked={formData.isActive}
          onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
        />
        <Label htmlFor="dept-active">Active (accepting complaints)</Label>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Configuration</h1>
          <p className="text-muted-foreground">
            Manage municipal departments, SLA rules, and officer assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Create a new municipal department. This will appear as a complaint category route.
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Departments"
          value={totalActive}
          icon={Building2}
          description={`out of ${departments.length} total`}
          variant="default"
        />
        <StatCard
          title="Total Officers"
          value={totalOfficers}
          icon={Users}
          description="across all departments"
          variant="default"
        />
        <StatCard
          title="Active Complaints"
          value={totalComplaints}
          icon={ClipboardList}
          description="awaiting resolution"
          variant="warning"
        />
        <StatCard
          title="Avg SLA Compliance"
          value={`${avgSLA}%`}
          icon={TrendingUp}
          description="this month"
          variant={avgSLA >= 90 ? "success" : avgSLA >= 75 ? "warning" : "danger"}
        />
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="self-center">
          {filtered.length} departments
        </Badge>
      </div>

      {/* Department cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((dept) => (
          <Card key={dept.id} className={dept.isActive ? "" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base leading-tight">{dept.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{dept.nameHindi}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={dept.isActive ? "default" : "secondary"} className="text-xs">
                    {dept.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEdit(dept)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(dept.id, dept.isActive)}>
                        {dept.isActive ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{dept.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{dept.contact}</span>
                </div>
              </div>

              <Separator />

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{dept.officers}</p>
                  <p className="text-xs text-muted-foreground">Officers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{dept.activeComplaints}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{dept.resolvedThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>

              {/* SLA compliance bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SLA Compliance</span>
                  <span
                    className={
                      dept.slaCompliance >= 90
                        ? "text-emerald-600 font-medium"
                        : dept.slaCompliance >= 75
                        ? "text-amber-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {dept.slaCompliance}%
                  </span>
                </div>
                <Progress
                  value={dept.slaCompliance}
                  className="h-1.5"
                />
              </div>

              {/* SLA and head officer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Default SLA: {dept.defaultSlaHours}h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span className={!dept.headOfficerId ? "text-amber-600" : ""}>
                    {dept.headOfficerName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department table (full detail view) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Overview Table</CardTitle>
          <CardDescription>Detailed view of all departments with SLA configuration</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Head Officer</TableHead>
                <TableHead className="text-center">Officers</TableHead>
                <TableHead className="text-center">Active Complaints</TableHead>
                <TableHead className="text-center">Default SLA</TableHead>
                <TableHead className="text-center">SLA Compliance</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dept) => (
                <TableRow key={dept.id} className={dept.isActive ? "" : "opacity-50"}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.nameHindi}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        !dept.headOfficerId
                          ? "text-amber-600 text-sm font-medium"
                          : "text-sm"
                      }
                    >
                      {dept.headOfficerName}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{dept.officers}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={dept.activeComplaints > 30 ? "destructive" : "secondary"}
                    >
                      {dept.activeComplaints}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{dept.defaultSlaHours}h</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        dept.slaCompliance >= 90
                          ? "text-emerald-600 font-medium text-sm"
                          : dept.slaCompliance >= 75
                          ? "text-amber-600 font-medium text-sm"
                          : "text-red-600 font-medium text-sm"
                      }
                    >
                      {dept.slaCompliance}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={dept.isActive ? "default" : "secondary"}>
                      {dept.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(dept)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update details for <strong>{editingDept?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDept(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
