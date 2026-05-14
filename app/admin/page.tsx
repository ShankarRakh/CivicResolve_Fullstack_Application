"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
  Building2,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { apiFetch } from "@/lib/api-client"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts"

// Chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface DashboardStats {
  counts: Record<string, number>
  categoryDistribution: { categoryId: string; categoryName: string; count: number }[]
  recentComplaints: {
    id: string
    displayId: string
    description: string
    status: string
    priority: string
    address: string | null
    categoryName: string | null
    categoryIcon: string | null
    departmentName: string | null
    assignedOfficerName: string | null
    citizenName: string | null
    slaDeadline: string | null
    createdAt: string
  }[]
  departmentPerformance: {
    name: string
    total: number
    resolved: number
    pending: number
    breached: number
    slaCompliance: number
  }[]
  topOfficers: {
    id: string
    name: string
    department: string
    resolved: number
    total: number
    resolutionRate: number
  }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiFetch<DashboardStats>("/api/admin/stats")
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">{error || "Failed to load"}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Complaints",
      value: stats.counts.total || 0,
      icon: ClipboardList,
      description: "All time complaints filed",
      color: "primary" as const
    },
    {
      title: "Pending",
      value: (stats.counts.PENDING || 0) + (stats.counts.ASSIGNED || 0),
      icon: Clock,
      description: "Awaiting resolution",
      color: "warning" as const
    },
    {
      title: "Resolved",
      value: (stats.counts.RESOLVED || 0) + (stats.counts.CLOSED || 0),
      icon: CheckCircle2,
      description: "Successfully closed",
      color: "success" as const
    },
    {
      title: "SLA Breached",
      value: stats.counts.SLA_BREACHED || 0,
      icon: AlertTriangle,
      description: "Overdue complaints",
      color: "danger" as const
    },
  ]

  // Prepare category data for pie chart
  const categoryData = stats.categoryDistribution.map((cat, i) => ({
    name: cat.categoryName,
    value: cat.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of municipal grievance management
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent complaints */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Complaints</CardTitle>
              <CardDescription>Latest complaints filed</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/complaints">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentComplaints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No complaints yet</p>
              ) : (
                stats.recentComplaints.map((complaint) => (
                  <Link 
                    key={complaint.id}
                    href={`/admin/complaints`}
                    className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {complaint.categoryName} — {complaint.description.slice(0, 60)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {complaint.displayId} · {complaint.address || "No address"}
                          </p>
                        </div>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={complaint.status} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Complaints by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data</p>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs font-medium ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Department SLA Compliance
            </CardTitle>
            <CardDescription>Performance by department</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.departmentPerformance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No department data</p>
            ) : (
              <div className="space-y-4">
                {stats.departmentPerformance.map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <span className="text-sm text-muted-foreground">{dept.slaCompliance}%</span>
                    </div>
                    <Progress 
                      value={dept.slaCompliance} 
                      className={`h-2 ${
                        dept.slaCompliance >= 90 ? "[&>div]:bg-emerald-500" :
                        dept.slaCompliance >= 70 ? "[&>div]:bg-amber-500" :
                        "[&>div]:bg-red-500"
                      }`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total: {dept.total}</span>
                      <span>Resolved: {dept.resolved}</span>
                      <span>Breached: {dept.breached}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Officer performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Officers
            </CardTitle>
            <CardDescription>Highest resolution rates</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topOfficers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No officer data</p>
            ) : (
              <div className="space-y-3">
                {stats.topOfficers.map((officer, idx) => (
                  <div key={officer.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>{officer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {idx < 3 && (
                        <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? "bg-yellow-400 text-yellow-900" :
                          idx === 1 ? "bg-gray-300 text-gray-700" :
                          "bg-orange-400 text-orange-900"
                        }`}>
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{officer.name}</p>
                      <p className="text-xs text-muted-foreground">{officer.department}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-500">
                          {officer.resolutionRate}% ({officer.resolved}/{officer.total})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
