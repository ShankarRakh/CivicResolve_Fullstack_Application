'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicNavbar } from '@/components/layout/public-navbar'
import { Footer } from '@/components/layout/footer'
import { CategoryIcon } from '@/components/common/category-icon'
import { CATEGORIES } from '@/lib/constants'
import { MOCK_COMPLAINTS, LANDING_STATS } from '@/lib/mock-data'
import { StatusBadge } from '@/components/common/status-badge'
import {
  ArrowRight,
  FileText,
  RefreshCw,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  ThumbsUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <StatsSection />
        <CategoriesSection />
        <RecentResolvedSection />
      </main>
      <Footer />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Your Voice. Your City.{' '}
                <span className="text-primary">Your Resolution.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Report civic issues. Track resolution in real-time. Hold your municipality accountable. Together, let&apos;s build a better city.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="gap-2">
                <Link href="/register">
                  Register as Citizen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/track">Track Complaint</Link>
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Real-time tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>SLA guaranteed</span>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-full max-w-lg">
              {/* Decorative elements */}
              <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-4 -right-4 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
              
              {/* Hero card */}
              <Card className="relative border-2 shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">COMPLAINT ID</span>
                    <StatusBadge status="in_progress" />
                  </div>
                  <p className="font-mono text-lg font-semibold">CR-2026-00142</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Near Shivaji Chowk, Ward 15</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>SLA: 18 hours remaining</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">In Progress</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      icon: FileText,
      title: 'Report',
      description: 'Submit your complaint with photos, location, and description. Takes less than 2 minutes.',
    },
    {
      icon: RefreshCw,
      title: 'Track',
      description: 'Get real-time updates via SMS and app. Know exactly when your issue will be resolved.',
    },
    {
      icon: CheckCircle2,
      title: 'Resolve',
      description: 'Rate the resolution and provide feedback. Help improve city services for everyone.',
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to resolve your civic issues
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="absolute left-1/2 top-8 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    wards: 0,
  })

  useEffect(() => {
    // Animate counters
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      setStats({
        total: Math.round(LANDING_STATS.totalComplaints * progress),
        resolved: Math.round(LANDING_STATS.resolvedPercent * progress),
        wards: Math.round(LANDING_STATS.totalWards * progress),
      })
      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-12 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4 text-center">
          <div>
            <p className="text-4xl font-bold">{stats.total.toLocaleString()}</p>
            <p className="mt-1 text-primary-foreground/80">Total Complaints</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{stats.resolved}%</p>
            <p className="mt-1 text-primary-foreground/80">Resolution Rate</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{stats.wards}</p>
            <p className="mt-1 text-primary-foreground/80">Wards Covered</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{LANDING_STATS.avgResolutionDays}d</p>
            <p className="mt-1 text-primary-foreground/80">Avg Resolution Time</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Report Any Civic Issue
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From potholes to water supply - we handle all municipal complaints
          </p>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              href={`/feed?category=${category.id}`}
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group-hover:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <CategoryIcon icon={category.icon} size="lg" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function RecentResolvedSection() {
  const resolvedComplaints = MOCK_COMPLAINTS.filter(c => c.status === 'resolved').slice(0, 3)

  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Recently Resolved
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how we&apos;re making a difference in your city
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {resolvedComplaints.length > 0 ? (
            resolvedComplaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">Before / After</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{complaint.displayId}</span>
                    <StatusBadge status={complaint.status} />
                  </div>
                  <h3 className="font-medium text-foreground">
                    {complaint.category.name} - {complaint.subcategory.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {complaint.location.ward}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {complaint.upvotes} upvotes
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No resolved complaints to show yet.
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/feed">
              View All Complaints
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
