// Shared type definitions for CivicResolve

export type UserRole = 'citizen' | 'officer' | 'field_worker' | 'admin'

export type ComplaintStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'work_completed'
  | 'resolved'
  | 'rejected'
  | 'closed'
  | 'reopened'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  role: UserRole
  ward?: string
  zone?: string
  department?: string
  avatar?: string
  isVerified?: boolean
  aadhaarLinked?: boolean
  createdAt?: string
}

export interface Subcategory {
  id: string
  name: string
  slaHours: number
}

export interface Category {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

export interface Location {
  lat: number
  lng: number
  address: string
  landmark?: string
  ward?: string
  zone?: string
}

export interface TimelineEntry {
  id: string
  status: string
  message: string
  by: string
  byRole: string
  timestamp: string
}

export interface Comment {
  id: string
  message: string
  by: string
  byRole: string
  isInternal: boolean
  timestamp: string
}

export interface Complaint {
  id: string
  displayId: string
  description: string
  category: Category
  subcategory?: Subcategory
  status: ComplaintStatus
  priority: ComplaintPriority
  location: Location
  images: string[]
  citizenId: string
  citizenName: string
  assignedOfficerId?: string
  assignedOfficerName?: string
  departmentId?: string
  departmentName?: string
  upvotes: number
  hasUpvoted: boolean
  slaDeadline?: string
  slaBreached: boolean
  slaRemainingHours?: number
  timeline: TimelineEntry[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  complaintId?: string
  isRead: boolean
  timestamp: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  target: string
  targetId?: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

export interface DashboardStats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  slaBreached: number
  avgResolutionDays: number
  satisfactionRating: number
}
