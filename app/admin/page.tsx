"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Building2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { CategoryIcon } from "@/components/common/category-icon"
import { MOCK_COMPLAINTS, MOCK_OFFICERS, MOCK_DEPARTMENT_STATS } from "@/lib/mock-data"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"

const weeklyData = [
  { name: "Mon", filed: 45, resolved: 38 },
  { name: "Tue", filed: 52, resolved: 45 },
  { name: "Wed", filed: 48, resolved: 50 },
  { name: "Thu", filed: 61, resolved: 55 },
  { name: "Fri", filed: 55, resolved: 52 },
  { name: "Sat", filed: 32, resolved: 28 },
  { name: "Sun", filed: 25, resolved: 22 },
]

const categoryData = [
  { name: "Roads", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Water", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Sanitation", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Electricity", value: 12, color: "hsl(var(--chart-4))" },
  { name: "Others", value: 8, color: "hsl(var(--chart-5))" },
]

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("week")

  const totalComplaints = MOCK_COMPLAINTS.length
  const pendingComplaints = MOCK_COMPLAINTS.filter(c => c.status === "pending").length
  const resolvedComplaints = MOCK_COMPLAINTS.filter(c => c.status === "resolved").length
  const slaBreached = MOCK_COMPLAINTS.filter(c => {
    const deadline = new Date(c.slaDeadline)
    return deadline < new Date() && c.status !== "resolved"
  }).length

  const stats = [
    {
      title: "Total Complaints",
      value: totalComplaints,
      icon: ClipboardList,
      description: "All time complaints filed",
      trend: { value: 12, isPositive: true },
      color: "primary" as const
    },
    {
      title: "Pending",
      value: pendingComplaints,
      icon: Clock,
      description: "Awaiting resolution",
      trend: { value: 5, isPositive: false },
      color: "warning" as const
    },
    {
      title: "Resolved",
      value: resolvedComplaints,
      icon: CheckCircle2,
      description: "Successfully closed",
      trend: { value: 18, isPositive: true },
      color: "success" as const
    },
    {
      title: "SLA Breached",
      value: slaBreached,
      icon: AlertTriangle,
      description: "Overdue complaints",
      trend: { value: 3, isPositive: false },
      color: "danger" as const
    },
  ]

  const recentComplaints = MOCK_COMPLAINTS.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of municipal grievance management
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period === "today" ? "Today" : period === "week" ? "This Week" : "This Month"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
            <CardDescription>Complaints filed vs resolved this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="filed" fill="hsl(var(--chart-1))" name="Filed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="hsl(var(--chart-3))" name="Resolved" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                  <span className="text-xs font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
              {recentComplaints.map((complaint) => (
                <Link 
                  key={complaint.id}
                  href={`/admin/complaints/${complaint.id}`}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <CategoryIcon icon={complaint.category.icon} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm truncate">
                          {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {complaint.displayId} · {complaint.location.address}
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Department Performance
            </CardTitle>
            <CardDescription>SLA compliance by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DEPARTMENT_STATS.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <span className="text-sm text-muted-foreground">{dept.slaCompliance}%</span>
                  </div>
                  <Progress 
                    value={dept.slaCompliance} 
                    className={`h-2 ${
                      dept.slaCompliance >= 90 ? "[&>div]:bg-success" :
                      dept.slaCompliance >= 70 ? "[&>div]:bg-warning" :
                      "[&>div]:bg-destructive"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Officer performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Performing Officers
            </CardTitle>
            <CardDescription>Officers with highest resolution rates</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">Manage Officers</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_OFFICERS.slice(0, 4).map((officer, idx) => (
              <div key={officer.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={officer.avatar} />
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
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-xs font-medium text-success">
                      {officer.resolutionRate}% resolution
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
