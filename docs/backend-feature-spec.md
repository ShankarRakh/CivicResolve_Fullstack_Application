# CivicResolve Backend Feature Spec (Minimal + Complete)

This document defines the backend features, data flows, and API contracts required to support the current frontend and planned MVP. It is optimized for a minimal yet complete implementation using Next.js Route Handlers + Prisma + Supabase Postgres.

---

## 1) Scope and Principles

- Keep the backend minimal, but fully functional for planned features.
- No enterprise extras (soft delete, advanced audit, multi-tenant).
- Use only models in the current Prisma schema.
- Prefer simple REST endpoints.
- Use role-based access (citizen/officer/admin).

---

## 2) Tech Stack

- Runtime: Node.js
- Framework: Next.js App Router API routes (`app/api/...`)
- ORM: Prisma
- DB: PostgreSQL (Supabase)
- Auth: JWT (simple, stateless) or NextAuth (optional)
- File storage: Supabase Storage (for complaint images)

---

## 3) Roles and Permissions

### Roles
- CITIZEN
- OFFICER
- ADMIN

### Permissions
| Feature | Citizen | Officer | Admin |
|---------|---------|---------|-------|
| Submit complaint | Yes | No | No |
| Track own complaints | Yes | No | No |
| View assigned complaints | No | Yes | Yes |
| Update complaint status | No | Yes | Yes |
| Assign complaint | No | No | Yes |
| View dashboards | Limited | Yes | Yes |
| Manage reference data | No | No | Yes |

---

## 4) Core Features and Data Flow

### A) Complaint Submission (Citizen)
**Flow**
1. Citizen submits complaint with category, description, location, images
2. Backend sets status = PENDING, priority default = MEDIUM
3. Complaint is stored in DB
4. Timeline entry created: "Complaint submitted"
5. (Optional) Auto-assign officer based on ward and category

**Required fields**
- categoryId
- description
- location: address, latitude, longitude, wardId (optional if unknown)
- images[] (optional)

---

### B) Officer Queue & Status Updates
**Flow**
1. Officer fetches assigned complaints
2. Officer updates status (ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED, CLOSED)
3. Timeline entry is created
4. Notification created for citizen

---

### C) Admin Assignment
**Flow**
1. Admin lists unassigned complaints
2. Admin assigns officer + department
3. Status becomes ASSIGNED
4. Timeline entry + notification to officer

---

### D) Complaint Timeline (Citizen/Officer/Admin)
- Timeline entries show who did what and when
- Used for citizen tracking UI

---

### E) Notifications
- Created on major actions: assignment, status change, resolution
- Stored in DB; frontend polls to show notification list

---

### F) Feedback (Citizen)
- Citizen rates complaint after resolution
- One feedback per complaint

---

## 5) Database Models (from schema.prisma)

### Department
- id, name, email, phone, headId

### Category
- id, name, icon

### Ward
- id, name, zone (string)

### User
- id, email, phone, passwordHash, name, role, departmentId

### Complaint
- citizenId, categoryId, description, status, priority
- location: address, latitude, longitude, wardId
- assignment: departmentId, assignedOfficerId
- slaDeadline
- images[]
- timeline, feedback relations

### ComplaintTimeline
- complaintId, status, message, createdAt

### Notification
- userId, type, message, isRead

### Feedback
- complaintId, citizenId, rating, comment

---

## 6) REST API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Complaints
- `POST /api/complaints` (Citizen)
- `GET /api/complaints` (Citizen: own, Officer/Admin: assigned)
- `GET /api/complaints/:id`
- `PATCH /api/complaints/:id/status` (Officer/Admin)
- `PATCH /api/complaints/:id/assign` (Admin)

### Timeline
- `GET /api/complaints/:id/timeline`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Feedback
- `POST /api/complaints/:id/feedback`
- `GET /api/complaints/:id/feedback`

### Reference Data
- `GET /api/departments`
- `GET /api/categories`
- `GET /api/wards`

---

## 7) Minimal Validation Rules

### Complaint Create
- categoryId: required
- description: required, min 10 chars
- latitude/longitude: optional but must be both if provided

### Status Update
- status: must be in enum
- only OFFICER or ADMIN

### Assignment
- assignedOfficerId + departmentId required
- only ADMIN

---

## 8) Image Handling

- Images stored in Supabase Storage
- Backend receives public image URLs
- `Complaint.images` is an array of image URLs

---

## 9) Frontend Adjustments Needed (if any)

- Replace mock data calls with API fetches
- Use auth token from login for API calls
- Load complaint timeline from `/api/complaints/:id/timeline`

---

## 10) Implementation Order (Recommended)

1. Auth endpoints (register/login/me)
2. Reference data (departments, categories, wards)
3. Complaint creation and listing
4. Status updates + timeline
5. Notifications
6. Feedback

---

## 11) Notes for AI IDE

- Keep backend minimal and aligned to schema
- No advanced role hierarchy beyond citizen/officer/admin
- No extra tables unless explicitly required
- Timeline entries are required for complaint detail view
- Notifications required for user dashboard

---

This document is the single source of truth for backend generation.
