"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  MapPin
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { CategoryIcon } from "@/components/common/category-icon"
import { MOCK_COMPLAINTS } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today")

  // Filter complaints assigned to officer
  const assignedComplaints = MOCK_COMPLAINTS.filter(c => c.assignedOfficerId === "officer-1")
  const pendingComplaints = assignedComplaints.filter(c => ["pending", "in_progress"].includes(c.status))
  const resolvedToday = assignedComplaints.filter(c => c.status === "resolved").length
  const slaBreached = assignedComplaints.filter(c => {
    const deadline = new Date(c.slaDeadline)
    return deadline < new Date() && c.status !== "resolved"
  }).length

  const stats = [
    {
      title: "Pending Tasks",
      value: pendingComplaints.length,
      icon: ClipboardList,
      description: "Complaints assigned to you",
      trend: { value: 3, isPositive: false },
      color: "primary" as const
    },
    {
      title: "Resolved Today",
      value: resolvedToday,
      icon: CheckCircle2,
      description: "Complaints closed today",
      trend: { value: 15, isPositive: true },
      color: "success" as const
    },
    {
      title: "SLA Breached",
      value: slaBreached,
      icon: AlertTriangle,
      description: "Overdue complaints",
      trend: { value: 2, isPositive: false },
      color: "danger" as const
    },
    {
      title: "Avg Resolution",
      value: "2.5 days",
      icon: Clock,
      description: "Average time to resolve",
      trend: { value: 8, isPositive: true },
      color: "warning" as const
    },
  ]

  // Get urgent complaints (approaching SLA)
  const urgentComplaints = pendingComplaints
    .filter(c => {
      const hoursLeft = (new Date(c.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
      return hoursLeft < 24 && hoursLeft > 0
    })
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.name?.split(" ")[0] || "Officer"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your workload overview for today
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Queue</CardTitle>
              <CardDescription>Complaints assigned to you</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/officer/queue">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingComplaints.slice(0, 5).map((complaint) => (
                <Link 
                  key={complaint.id}
                  href={`/officer/queue/${complaint.id}`}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
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
                      <SLATimer deadline={complaint.slaDeadline} compact />
                    </div>
                  </div>
                </Link>
              ))}
              {pendingComplaints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending complaints!</p>
                  <p className="text-sm">Great job keeping up with your queue.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgent alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Urgent Alerts
            </CardTitle>
            <CardDescription>Complaints requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentComplaints.length > 0 ? (
                urgentComplaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/officer/queue/${complaint.id}`}
                    className="block p-3 rounded-lg border border-warning/50 bg-warning/5 hover:bg-warning/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-warning">SLA EXPIRING SOON</span>
                      <SLATimer deadline={complaint.slaDeadline} compact />
                    </div>
                    <p className="font-medium text-sm">
                        {complaint.title ?? complaint.category.name + " — " + complaint.subcategory.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {complaint.location.address}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No urgent alerts</p>
                </div>
              )}

              {slaBreached > 0 && (
                <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      {slaBreached} SLA Breached
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Immediate action required
                  </p>
                  <Button variant="destructive" size="sm" className="mt-2 w-full" asChild>
                    <Link href="/officer/queue?filter=breached">View All</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            My Performance
          </CardTitle>
          <CardDescription>Your resolution metrics this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Resolution Rate</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: 90%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">SLA Compliance</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Citizen Satisfaction</span>
                <span className="text-sm font-medium">4.2/5</span>
              </div>
              <Progress value={84} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Based on 28 ratings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
