'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PublicNavbar } from '@/components/layout/public-navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { PriorityBadge } from '@/components/common/priority-badge'
import { CategoryIcon } from '@/components/common/category-icon'
import { MOCK_COMPLAINTS } from '@/lib/mock-data'
import { CATEGORIES, WARDS } from '@/lib/constants'
import { Search, MapPin, ThumbsUp, MessageSquare, Clock, Filter, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function PublicFeedPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredComplaints = useMemo(() => {
    return MOCK_COMPLAINTS.filter(complaint => {
      const matchesSearch = search === '' || 
        complaint.description.toLowerCase().includes(search.toLowerCase()) ||
        complaint.displayId.toLowerCase().includes(search.toLowerCase()) ||
        complaint.location.address.toLowerCase().includes(search.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || complaint.category.id === selectedCategory
      const matchesWard = selectedWard === 'all' || complaint.location.ward === selectedWard
      const matchesStatus = selectedStatus === 'all' || complaint.status === selectedStatus

      return matchesSearch && matchesCategory && matchesWard && matchesStatus
    })
  }, [search, selectedCategory, selectedWard, selectedStatus])

  const activeFiltersCount = [selectedCategory, selectedWard, selectedStatus].filter(f => f !== 'all').length

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedWard('all')
    setSelectedStatus('all')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Public Complaint Feed
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse and upvote civic issues reported by citizens in your city
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="sm:w-auto gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1.5 min-w-[150px]">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 min-w-[150px]">
                      <label className="text-sm font-medium">Ward</label>
                      <Select value={selectedWard} onValueChange={setSelectedWard}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Wards" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Wards</SelectItem>
                          {WARDS.map(ward => (
                            <SelectItem key={ward.id} value={ward.name}>{ward.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 min-w-[150px]">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredComplaints.length} complaints
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <Card key={complaint.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <CategoryIcon icon={complaint.category.icon} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {complaint.category.name}
                            </span>
                            <span className="text-muted-foreground">{'>'}</span>
                            <span className="text-muted-foreground">
                              {complaint.subcategory.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{complaint.location.ward}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <StatusBadge status={complaint.status} />
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3">
                    <p className="text-foreground line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {complaint.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {complaint.comments.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/track?id=${complaint.displayId}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reported by: Citizen from {complaint.location.ward}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">No complaints found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
