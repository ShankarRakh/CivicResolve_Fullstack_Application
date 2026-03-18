'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicNavbar } from '@/components/layout/public-navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { SLATimer } from '@/components/common/sla-timer'
import { CategoryIcon } from '@/components/common/category-icon'
import { MOCK_COMPLAINTS } from '@/lib/mock-data'
import { toast } from 'sonner'
import { Search, MapPin, Clock, Calendar, User, Building2, MessageSquare, ArrowRight } from 'lucide-react'
import type { Complaint } from '@/types'

export default function TrackComplaintPage() {
  const [complaintId, setComplaintId] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<Complaint | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleTrackById = async () => {
    if (!complaintId) {
      toast.error('Please enter a complaint ID')
      return
    }
    setIsLoading(true)
    setNotFound(false)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Search mock data
    const found = MOCK_COMPLAINTS.find(
      c => c.displayId.toLowerCase() === complaintId.toLowerCase() || c.id === complaintId
    )
    
    setIsLoading(false)
    if (found) {
      setResult(found)
      toast.success('Complaint found!')
    } else {
      setResult(null)
      setNotFound(true)
      toast.error('Complaint not found')
    }
  }

  const handleTrackByPhone = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.info('OTP verification would be required to view complaints. Please login for full access.')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Track Your Complaint
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your complaint ID or registered phone number to check the status
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <Tabs defaultValue="id" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="id">By Complaint ID</TabsTrigger>
                  <TabsTrigger value="phone">By Phone Number</TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="complaintId">Complaint ID</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="complaintId"
                          placeholder="e.g., CR-2026-00142"
                          className="pl-10"
                          value={complaintId}
                          onChange={(e) => setComplaintId(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleTrackById()}
                        />
                      </div>
                      <Button onClick={handleTrackById} disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Track'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hint: Try searching for CR-2026-00142
                  </p>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Registered Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10-digit number"
                        className="flex-1"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                      <Button onClick={handleTrackByPhone} disabled={isLoading || phone.length !== 10}>
                        {isLoading ? 'Verifying...' : 'Send OTP'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You will receive an OTP to verify and view all your complaints
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Result Section */}
          {result && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono">{result.displayId}</span>
                      <StatusBadge status={result.status} />
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <CategoryIcon icon={result.category.icon} size="sm" />
                      {result.category.name} - {result.subcategory.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={result.priority} />
                    {result.status !== 'resolved' && result.status !== 'closed' && (
                      <SLATimer 
                        deadline={result.slaDeadline} 
                        breached={result.slaBreached}
                        remainingHours={result.slaRemainingHours}
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <p className="text-foreground">{result.location.address}</p>
                  {result.location.landmark && (
                    <p className="text-sm text-muted-foreground">Landmark: {result.location.landmark}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{result.location.ward}, {result.location.zone}</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-foreground">{result.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Department
                    </p>
                    <p className="text-foreground">{result.departmentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assigned Officer
                    </p>
                    <p className="text-foreground">{result.assignedOfficerName || 'Not yet assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Filed On
                    </p>
                    <p className="text-foreground">
                      {new Date(result.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      SLA Deadline
                    </p>
                    <p className="text-foreground">
                      {new Date(result.slaDeadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
                  <div className="space-y-4">
                    {result.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          {index < result.timeline.length - 1 && (
                            <div className="absolute top-3 h-full w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <StatusBadge status={event.status} />
                            <span className="text-muted-foreground">
                              {new Date(event.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-foreground">{event.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">by {event.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button asChild>
                    <Link href="/login">
                      Login for More Actions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Found */}
          {notFound && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Complaint Not Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please check the complaint ID and try again, or{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    login to view your complaints
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
