"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PriorityBadge } from "@/components/common/priority-badge"
import { SLATimer } from "@/components/common/sla-timer"
import { CategoryIcon } from "@/components/common/category-icon"
import { CATEGORIES } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"
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
interface Stats {
  total: number
  pending: number
  assigned: number
  inProgress: number
  resolved: number
  resolvedToday: number
  slaBreached: number
}

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today")
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [complaintsRes, statsRes] = await Promise.all([
          apiFetch<{ items: Complaint[] }>('/api/complaints'),
          apiFetch<Stats>('/api/complaints/stats'),
        ])
        setComplaints(complaintsRes.items)
        setStats(statsRes)
      } catch (err) {
        console.error('Failed to fetch officer data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived data
  const pendingComplaints = complaints.filter(c =>
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)
  )
  const resolvedToday = stats?.resolvedToday ?? 0
  const slaBreached = stats?.slaBreached ?? 0

  const statCards = [
    {
      title: "Pending Tasks",
      value: pendingComplaints.length,
      icon: ClipboardList,
      description: "Complaints assigned to you",
      trend: { value: pendingComplaints.length, isPositive: false },
      color: "primary" as const
    },
    {
      title: "Resolved Today",
      value: resolvedToday,
      icon: CheckCircle2,
      description: "Complaints closed today",
      trend: { value: resolvedToday, isPositive: true },
      color: "success" as const
    },
    {
      title: "SLA Breached",
      value: slaBreached,
      icon: AlertTriangle,
      description: "Overdue complaints",
      trend: { value: slaBreached, isPositive: false },
      color: "danger" as const
    },
    {
      title: "Total Assigned",
      value: stats?.total ?? 0,
      icon: Clock,
      description: "All complaints assigned",
      trend: { value: stats?.resolved ?? 0, isPositive: true },
      color: "warning" as const
    },
  ]

  // Get urgent complaints (approaching SLA — within 24h)
  const urgentComplaints = pendingComplaints
    .filter(c => {
      if (!c.slaDeadline) return false
      const hoursLeft = (new Date(c.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
      return hoursLeft < 24 && hoursLeft > 0
    })
    .slice(0, 3)

  // Performance metrics — computed from real data
  const totalAssigned = stats?.total ?? 0
  const totalResolved = stats?.resolved ?? 0
  const resolutionRate = totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0
  const nonBreached = totalAssigned - slaBreached
  const slaCompliance = totalAssigned > 0 ? Math.round((nonBreached / totalAssigned) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
        {statCards.map((stat) => (
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
              {pendingComplaints.slice(0, 5).map((complaint: Complaint) => {
                const cat = resolveCategory(complaint.categoryId)
                const subcat = resolveSubcategory(complaint.categoryId, complaint.subcategoryId)
                return (
                  <Link 
                    key={complaint.id}
                    href={`/officer/queue/${complaint.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <CategoryIcon icon={complaint.categoryIcon || cat?.icon || 'MoreHorizontal'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {(complaint.categoryName || cat?.name || 'Unknown') + " — " + (subcat?.name || complaint.subcategoryId)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {complaint.displayId} · {complaint.address || 'No address'}
                          </p>
                        </div>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={complaint.status} />
                        {complaint.slaDeadline && <SLATimer deadline={complaint.slaDeadline} compact />}
                      </div>
                    </div>
                  </Link>
                )
              })}
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
                urgentComplaints.map((complaint: Complaint) => {
                  const cat = resolveCategory(complaint.categoryId)
                  const subcat = resolveSubcategory(complaint.categoryId, complaint.subcategoryId)
                  return (
                    <Link
                      key={complaint.id}
                      href={`/officer/queue/${complaint.id}`}
                      className="block p-3 rounded-lg border border-warning/50 bg-warning/5 hover:bg-warning/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-warning">SLA EXPIRING SOON</span>
                        {complaint.slaDeadline && <SLATimer deadline={complaint.slaDeadline} compact />}
                      </div>
                      <p className="font-medium text-sm">
                        {(complaint.categoryName || cat?.name || 'Unknown') + " — " + (subcat?.name || complaint.subcategoryId)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {complaint.address || 'No address'}
                      </p>
                    </Link>
                  )
                })
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
          <CardDescription>Your resolution metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Resolution Rate</span>
                <span className="text-sm font-medium">{resolutionRate}%</span>
              </div>
              <Progress value={resolutionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: 90%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">SLA Compliance</span>
                <span className="text-sm font-medium">{slaCompliance}%</span>
              </div>
              <Progress value={slaCompliance} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Resolved</span>
                <span className="text-sm font-medium">{totalResolved}</span>
              </div>
              <Progress value={resolutionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Out of {totalAssigned} assigned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
