"use client"

import { useState } from "react"
import { 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MOCK_DEPARTMENT_STATS } from "@/lib/mock-data"
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
  Cell,
  Area,
  AreaChart
} from "recharts"

const monthlyTrendData = [
  { month: "Jan", filed: 320, resolved: 280, avgResolutionTime: 3.2 },
  { month: "Feb", filed: 350, resolved: 310, avgResolutionTime: 3.0 },
  { month: "Mar", filed: 380, resolved: 340, avgResolutionTime: 2.8 },
  { month: "Apr", filed: 420, resolved: 390, avgResolutionTime: 2.5 },
  { month: "May", filed: 450, resolved: 420, avgResolutionTime: 2.3 },
  { month: "Jun", filed: 480, resolved: 460, avgResolutionTime: 2.1 },
]

const wardData = [
  { ward: "Ward 1", complaints: 85, resolved: 78, pending: 7 },
  { ward: "Ward 2", complaints: 72, resolved: 65, pending: 7 },
  { ward: "Ward 3", complaints: 95, resolved: 88, pending: 7 },
  { ward: "Ward 4", complaints: 63, resolved: 55, pending: 8 },
  { ward: "Ward 5", complaints: 78, resolved: 72, pending: 6 },
]

const categoryTrendData = [
  { name: "Roads", value: 35, trend: 8, color: "hsl(var(--chart-1))" },
  { name: "Water Supply", value: 25, trend: -3, color: "hsl(var(--chart-2))" },
  { name: "Sanitation", value: 20, trend: 5, color: "hsl(var(--chart-3))" },
  { name: "Electricity", value: 12, trend: -2, color: "hsl(var(--chart-4))" },
  { name: "Parks", value: 8, trend: 1, color: "hsl(var(--chart-5))" },
]

const resolutionTimeData = [
  { range: "< 24h", count: 120 },
  { range: "24-48h", count: 180 },
  { range: "48-72h", count: 95 },
  { range: "3-5 days", count: 45 },
  { range: "> 5 days", count: 20 },
]

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("6months")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into grievance management performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
                <p className="text-3xl font-bold">2,450</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">12%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-3xl font-bold">94.2%</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">2.5%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Target: 95%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-3xl font-bold">2.1 days</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">15%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Improved from 2.5 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citizen Satisfaction</p>
                <p className="text-3xl font-bold">4.3/5</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">0.2</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Based on 850 ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Complaints filed vs resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="filed" 
                    stackId="1"
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))" 
                    fillOpacity={0.3}
                    name="Filed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    stackId="2"
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))" 
                    fillOpacity={0.3}
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Complaints by category with trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryTrendData.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.value}%</span>
                      <Badge 
                        variant={category.trend > 0 ? "default" : "secondary"}
                        className={`text-xs ${category.trend > 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}`}
                      >
                        {category.trend > 0 ? "+" : ""}{category.trend}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={category.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolution time distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Time Distribution</CardTitle>
            <CardDescription>How quickly complaints are resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolutionTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="range" type="category" className="text-xs" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 4, 4, 0]}
                    name="Complaints"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward-wise and Department performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ward-wise distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ward-wise Distribution
            </CardTitle>
            <CardDescription>Complaints by ward</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="ward" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="resolved" stackId="a" fill="hsl(var(--chart-3))" name="Resolved" />
                  <Bar dataKey="pending" stackId="a" fill="hsl(var(--chart-4))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department SLA compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Department SLA Compliance</CardTitle>
            <CardDescription>Performance by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DEPARTMENT_STATS.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{dept.slaCompliance}%</span>
                      {dept.slaCompliance >= 90 ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : dept.slaCompliance >= 70 ? (
                        <Clock className="h-4 w-4 text-warning" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={dept.slaCompliance} 
                    className={`h-2 ${
                      dept.slaCompliance >= 90 ? "[&>div]:bg-success" :
                      dept.slaCompliance >= 70 ? "[&>div]:bg-warning" :
                      "[&>div]:bg-destructive"
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total: {dept.total}</span>
                    <span>Resolved: {dept.resolved}</span>
                    <span>Pending: {dept.pending}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
