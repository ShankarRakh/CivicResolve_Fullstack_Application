import type { Category, ComplaintStatus, ComplaintPriority } from '@/types'

export const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  assigned: { label: 'Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  work_completed: { label: 'Work Completed', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  resolved: { label: 'Resolved', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  closed: { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  reopened: { label: 'Reopened', color: 'text-orange-700', bgColor: 'bg-orange-100' },
}

export const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  medium: { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' },
  critical: { label: 'Critical', color: 'text-red-900', bgColor: 'bg-red-200' },
}

export const CATEGORIES: Category[] = [
  {
    id: 'water',
    name: 'Water Supply',
    icon: 'Droplets',
    subcategories: [
      { id: 'no-supply', name: 'No Water Supply', slaHours: 24 },
      { id: 'low-pressure', name: 'Low Pressure', slaHours: 48 },
      { id: 'contaminated', name: 'Contaminated Water', slaHours: 12 },
      { id: 'leakage', name: 'Pipeline Leakage', slaHours: 24 },
      { id: 'billing', name: 'Billing Issue', slaHours: 72 },
    ],
  },
  {
    id: 'roads',
    name: 'Roads',
    icon: 'Route',
    subcategories: [
      { id: 'pothole', name: 'Pothole', slaHours: 72 },
      { id: 'road-damage', name: 'Road Damage', slaHours: 72 },
      { id: 'footpath', name: 'Footpath Encroachment', slaHours: 96 },
      { id: 'speed-breaker', name: 'Speed Breaker Issue', slaHours: 120 },
      { id: 'digging', name: 'Unauthorized Road Digging', slaHours: 48 },
      { id: 'restoration', name: 'Road Digging Not Restored', slaHours: 72 },
    ],
  },
  {
    id: 'garbage',
    name: 'Garbage & Sanitation',
    icon: 'Trash2',
    subcategories: [
      { id: 'not-collected', name: 'Not Collected', slaHours: 24 },
      { id: 'dump-yard', name: 'Illegal Dump Yard', slaHours: 48 },
      { id: 'public-toilet', name: 'Public Toilet Issue', slaHours: 24 },
      { id: 'drain-cleaning', name: 'Drain Cleaning', slaHours: 48 },
    ],
  },
  {
    id: 'lights',
    name: 'Street Lights',
    icon: 'Lightbulb',
    subcategories: [
      { id: 'not-working', name: 'Light Not Working', slaHours: 72 },
      { id: 'damaged', name: 'Pole/Light Damaged', slaHours: 48 },
      { id: 'new-light', name: 'New Light Required', slaHours: 168 },
    ],
  },
  {
    id: 'drainage',
    name: 'Drainage',
    icon: 'Waves',
    subcategories: [
      { id: 'blocked', name: 'Drain Blocked', slaHours: 24 },
      { id: 'overflow', name: 'Drain Overflow', slaHours: 24 },
      { id: 'damaged-drain', name: 'Damaged Drain', slaHours: 72 },
      { id: 'mosquito', name: 'Mosquito Breeding', slaHours: 48 },
    ],
  },
  {
    id: 'health',
    name: 'Health & Safety',
    icon: 'Heart',
    subcategories: [
      { id: 'stray-animals', name: 'Stray Animals', slaHours: 48 },
      { id: 'dead-animal', name: 'Dead Animal Removal', slaHours: 12 },
      { id: 'food-safety', name: 'Food Safety Violation', slaHours: 24 },
      { id: 'public-nuisance', name: 'Public Nuisance', slaHours: 72 },
    ],
  },
  {
    id: 'trees',
    name: 'Trees & Parks',
    icon: 'TreeDeciduous',
    subcategories: [
      { id: 'fallen-tree', name: 'Fallen Tree', slaHours: 24 },
      { id: 'dangerous-tree', name: 'Dangerous Tree', slaHours: 48 },
      { id: 'tree-trimming', name: 'Tree Trimming Required', slaHours: 168 },
      { id: 'park-maintenance', name: 'Park Maintenance', slaHours: 120 },
    ],
  },
  {
    id: 'building',
    name: 'Buildings',
    icon: 'Building2',
    subcategories: [
      { id: 'illegal-construction', name: 'Illegal Construction', slaHours: 72 },
      { id: 'dangerous-building', name: 'Dangerous Building', slaHours: 24 },
      { id: 'property-tax', name: 'Property Tax Issue', slaHours: 168 },
    ],
  },
  {
    id: 'encroachment',
    name: 'Encroachment',
    icon: 'Ban',
    subcategories: [
      { id: 'footpath-encroach', name: 'Footpath Encroachment', slaHours: 96 },
      { id: 'public-space', name: 'Public Space Encroachment', slaHours: 96 },
      { id: 'illegal-parking', name: 'Illegal Parking', slaHours: 48 },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    subcategories: [
      { id: 'other-issue', name: 'Other Issue', slaHours: 120 },
    ],
  },
]

export const WARDS = Array.from({ length: 20 }, (_, i) => ({
  id: `ward-${i + 1}`,
  number: i + 1,
  name: `Ward ${i + 1}`,
  zone: `Zone ${Math.ceil((i + 1) / 5)}`,
}))

export const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4']

export const DEPARTMENTS = [
  { id: 'roads', name: 'Roads Department', nameHindi: 'Raste Vibhag' },
  { id: 'water', name: 'Water Supply', nameHindi: 'Jal Purti' },
  { id: 'sanitation', name: 'Sanitation', nameHindi: 'Swachhata' },
  { id: 'electrical', name: 'Electrical', nameHindi: 'Vidyut' },
  { id: 'health', name: 'Health', nameHindi: 'Swasthya' },
  { id: 'building', name: 'Building & Town Planning', nameHindi: 'Bhavan Nirman' },
  { id: 'garden', name: 'Garden & Trees', nameHindi: 'Udyan' },
  { id: 'encroachment', name: 'Anti-Encroachment', nameHindi: 'Atikraman Nirmulan' },
]

export const LANDING_STATS = [
  { label: 'Complaints Resolved', value: '45,230+', icon: 'CheckCircle2' },
  { label: 'Active Citizens', value: '1,20,000+', icon: 'Users' },
  { label: 'Average Resolution Time', value: '3.2 Days', icon: 'Clock' },
  { label: 'Satisfaction Rate', value: '94%', icon: 'ThumbsUp' },
]

// convenience aliases used by page components
export const COMPLAINT_CATEGORIES = CATEGORIES

export const COMPLAINT_STATUSES = Object.entries(COMPLAINT_STATUS_CONFIG).map(
  ([id, config]) => ({ id, ...config })
)

export const PRIORITY_LEVELS = Object.entries(PRIORITY_CONFIG).map(
  ([id, config]) => ({ id, ...config })
)
