"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Search, 
  Plus,
  MoreHorizontal,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import { toast } from "sonner"

interface StaffUser {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: { id: string; name: string } | null
  complaintsCount: number
}

interface Department {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Add user form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<string>("")
  const [formDepartment, setFormDepartment] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [usersData, deptsData] = await Promise.all([
        apiFetch<{ users: StaffUser[] }>("/api/admin/users"),
        apiFetch<{ departments: Department[] }>("/api/admin/departments"),
      ])
      setUsers(usersData.users)
      setDepartments(deptsData.departments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesDepartment = departmentFilter === "all" || user.department?.id === departmentFilter
    
    return matchesSearch && matchesRole && matchesDepartment
  })

  const handleAddUser = async () => {
    if (!formName || !formEmail || !formPhone || !formPassword || !formRole) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    try {
      const newUser = await apiFetch<StaffUser>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          password: formPassword,
          role: formRole,
          departmentId: formDepartment || undefined,
        }),
      })

      // Refresh the list
      await fetchData()
      toast.success(`User ${newUser.name} created successfully`)
      setShowAddDialog(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: StaffUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}? Their ${user.complaintsCount} assigned complaint(s) will be unassigned.`
    )
    if (!confirmed) return

    setDeleting(user.id)
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success(`User ${user.name} deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPhone("")
    setFormPassword("")
    setFormRole("")
    setFormDepartment("")
  }

  // Count stats from loaded data
  const officerCount = users.filter((u) => u.role === "OFFICER").length
  const adminCount = users.filter((u) => u.role === "ADMIN").length
  const totalComplaints = users.reduce((sum, u) => sum + u.complaintsCount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading users...</p>
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
          <Button variant="outline" className="mt-4" onClick={fetchData}>
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
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage officers and administrators
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Officer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Officer</DialogTitle>
                <DialogDescription>
                  Create a new officer or admin account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 XXXXX XXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Minimum 6 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formRole} onValueChange={setFormRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OFFICER">Field Officer</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formDepartment} onValueChange={setFormDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm() }}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{officerCount}</p>
                <p className="text-sm text-muted-foreground">Officers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalComplaints}</p>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OFFICER">Officers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No users match your search" : "No staff users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={deleting === user.id ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "OFFICER" ? "default" : "secondary"}>
                        {user.role === "OFFICER" ? "Officer" : "Admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{user.complaintsCount}</span>
                      <span className="text-xs text-muted-foreground ml-1">complaints</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={deleting === user.id}>
                            {deleting === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
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
    </div>
  )
}
