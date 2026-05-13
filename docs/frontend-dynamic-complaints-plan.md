# Frontend Dynamic Complaints Plan

## Goal
Replace citizen-facing mock data with live backend data while keeping client-side filtering and using browser geolocation only. This document is the single reference for required API endpoints, data mapping, and known inconsistencies.

## Scope (Citizen)
- Dashboard stats and recent complaints
- My complaints list
- Complaint detail view
- Notifications list + unread badge
- New complaint location (lat/lng) using browser geolocation
- Ward stats and announcements are deferred (placeholders remain)

## Current Backend State (Relevant)
- POST /api/complaints creates complaint and timeline entry, assigns ward using lat/lng if wardId not provided.
- Ward table has centerLat/centerLng (seeded via prisma/seed.ts).
- Categories and subcategories are defined in lib/constants.ts only (no DB table for subcategories).
- Notifications are stored in DB but only include type + message.

## Data Model Inconsistencies (Must Resolve)
1) Ward data source mismatch
- DB had mixed wards (real names + Ward 1..20). This has been normalized to real wards only.
- UI must stop using Ward 1..20 constants for display; use ward name from DB.

2) Complaint subcategory
- DB stores subcategoryId only.
- UI expects subcategory object with name + slaHours.
- Map subcategoryId to constants at render time.

3) Complaint location shape
- UI expects complaint.location { address, landmark, ward, zone }.
- DB stores address, latitude, longitude, wardId; zone is on Ward table.
- Landmark is not stored; use address as the only location line.

4) Timeline and comments
- DB timeline does not store by/byRole; UI renders these.
- Comments are not modeled in DB yet but UI expects them.

5) Notification fields
- DB Notification has type + message only.
- UI expects title, complaintId, timestamp; also uses isRead.

6) Status casing
- UI mock data uses lowercase; DB uses enums (uppercase).
- StatusBadge normalizes to uppercase, so this is acceptable but keep consistent in API responses.

## DB Findings (2026-05-13)
- Ward table now only contains real wards (Hadapsar, Kothrud, etc.).
- Complaints now reference real wards; 1 complaint still has ward_id = null.
- Category/subcategory stored as IDs (water/no-supply, roads/pothole, etc.). This matches constants but needs mapping to names + slaHours.
- Notifications table only contains type + message + is_read + created_at (no title/complaintId fields).

## Proposed API Endpoints
These are the minimal endpoints needed to remove mock data. All should require Bearer token.

### 1) GET /api/complaints
Return complaints for current citizen. Client-side filtering will be applied in the UI.

Query params (optional):
- limit: number
- offset: number
- sort: newest|oldest

Response (example):
{
  "items": [
    {
      "id": "...",
      "displayId": "CR-2026-00001",
      "description": "...",
      "categoryId": "roads",
      "subcategoryId": "pothole",
      "status": "PENDING",
      "priority": "MEDIUM",
      "address": "...",
      "latitude": 18.5089,
      "longitude": 73.9259,
      "wardId": "hadapsar",
      "images": ["..."] ,
      "createdAt": "...",
      "updatedAt": "...",
      "slaDeadline": "..."
    }
  ],
  "total": 12
}

### 2) GET /api/complaints/[id]
Return complaint detail for the logged-in citizen.

Response should include:
- complaint fields as above
- timeline entries (even if basic)
- assignedOfficer and department if available

### 3) GET /api/complaints/stats
Return counts by status for current citizen.

Response (example):
{
  "total": 8,
  "pending": 3,
  "inProgress": 2,
  "resolved": 3
}

### 4) GET /api/notifications
Return notifications for current user.

Response (example):
{
  "items": [
    {
      "id": "...",
      "type": "status_update",
      "title": "Status Updated",
      "message": "Your complaint CR-2026-00001 is now In Progress",
      "complaintId": "...",
      "isRead": false,
      "createdAt": "..."
    }
  ]
}

### 5) PATCH /api/notifications/[id]
Mark notification as read.

## Frontend Changes (By File)

### 1) Dashboard
File: app/citizen/page.tsx
- Replace MOCK_CITIZEN_STATS with GET /api/complaints/stats
- Replace recent complaints with GET /api/complaints?limit=3
- Map categoryId + subcategoryId to constants before rendering
- Announcements: keep mock or hide until endpoint exists
- Ward stats: keep static placeholder until ward profile exists

### 2) My Complaints
File: app/citizen/complaints/page.tsx
- Replace MOCK_COMPLAINTS with GET /api/complaints
- Keep client-side search/filter/sort over fetched list
- Map categoryId/subcategoryId to constants when rendering

### 3) Complaint Detail
File: app/citizen/complaints/[id]/page.tsx
- Replace mock lookup with GET /api/complaints/[id]
- Render timeline from API (even if no by/byRole yet)
- Render images from complaint.images

### 4) Notifications
File: app/citizen/notifications/page.tsx
- Replace MOCK_NOTIFICATIONS with GET /api/notifications
- Mark as read calls PATCH /api/notifications/[id]

### 5) Unread badge
File: app/citizen/layout.tsx
- Replace MOCK_NOTIFICATIONS count with unread count from API
- Option A: fetch notifications and derive unread
- Option B: add GET /api/notifications/unread-count

### 6) New Complaint Location
File: app/citizen/complaints/new/page.tsx
- Replace hardcoded lat/lng with browser geolocation:
  - On "Use my current location", call navigator.geolocation.getCurrentPosition
  - Set location.lat/lng with real values
- Keep address manual input for now
- WardId: let backend auto-assign based on lat/lng (preferred)

## Data Mapping Rules (Frontend)
To keep UI intact while DB remains minimal:

- Category mapping:
  - categoryId -> CATEGORIES.find(c.id)
- Subcategory mapping:
  - subcategoryId -> category.subcategories.find(s.id)
- Ward display:
  - wardId -> fetch ward name + zone from DB join or /api/wards
- Landmark:
  - not stored; use address as the only location line
- Status:
  - use uppercase from DB; StatusBadge already normalizes

## Deferred Features
- Ward stats on dashboard (requires user wardId and ward-level aggregations)
- Announcements (requires announcements table)
- Comments on complaints (requires comment table)
- Officer details on complaint detail (requires joins and officer profile API)

## Action Plan (Step Order)
1) Add GET /api/complaints (list) and GET /api/complaints/[id]
2) Add GET /api/complaints/stats
3) Add GET /api/notifications and PATCH /api/notifications/[id]
4) Update dashboard, complaints list, detail, notifications to fetch real data
5) Update New Complaint geolocation
6) Replace unread badge logic
7) Remove complaint mocks from lib/mock-data.ts

## Validation Checklist
- Login and create complaint works end-to-end
- Dashboard shows correct counts and recent complaints
- My complaints list filters work on real data
- Detail page loads correct complaint
- Notifications show and mark read
- New complaint uses browser location and backend assigns ward

## Notes on DB Inconsistencies
- User profile fields (city, pincode, address, wardId) are not stored; leave profile/settings out for now.
- Wards are normalized to real ward names; UI should not rely on Ward 1..20 constants.
- Notification title/complaintId can be computed in API until schema changes are added.
