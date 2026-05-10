// Shared type definitions for CivicResolve
// Aligned with Prisma schema

// ==========================================
// Enums matching Prisma schema
// ==========================================

export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN'

export type ComplaintStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED'

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ==========================================
// Frontend-only types used by UI components
// (These are used in constants.ts & complaint pages,
//  not necessarily mirroring Prisma models 1:1)
// ==========================================

export type NotificationType = 'status_update' | 'comment' | 'assignment' | 'sla_warning' | 'sla_breach' | 'system'

export interface SubCategory {
  id: string
  name: string
  slaHours: number
}

// ==========================================
// Models matching Prisma schema
// ==========================================

export interface User {
  id: string
  name: string
  phone: string
  email: string
  role: UserRole
  departmentId?: string
  department?: string
  createdAt?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  // subcategories is frontend-only; not in Prisma Category model
  subcategories?: SubCategory[]
}

export interface Ward {
  id: string
  name: string
  zone: string
}

export interface Department {
  id: string
  name: string
  email?: string
  phone?: string
  headId?: string
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
  complaintId?: string
  status: string
  message: string
  by?: string
  byRole?: string
  createdAt?: string
  timestamp?: string
}

export interface Complaint {
  id: string
  displayId?: string
  description: string
  category: Category
  subcategory?: SubCategory
  status: ComplaintStatus
  priority: ComplaintPriority
  address?: string
  latitude?: number
  longitude?: number
  wardId?: string
  images: string[]
  citizenId: string
  citizenName?: string
  assignedOfficerId?: string
  assignedOfficerName?: string
  departmentId?: string
  departmentName?: string
  slaDeadline?: string
  slaBreached?: boolean
  slaRemainingHours?: number
  upvotes?: number
  hasUpvoted?: boolean
  location?: Location
  timeline: TimelineEntry[]
  comments?: Comment[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface Comment {
  id: string
  message: string
  by: string
  byRole: string
  isInternal: boolean
  timestamp: string
}

export interface Notification {
  id: string
  userId?: string
  type: string
  title?: string
  message: string
  complaintId?: string
  isRead: boolean
  createdAt?: string
  timestamp?: string
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

export interface Feedback {
  id: string
  complaintId: string
  citizenId: string
  rating: number
  comment?: string
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
