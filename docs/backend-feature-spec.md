# CivicResolve Backend Feature Spec (Full Plan)

This document consolidates all features and flows we planned in this chat. It is a guide for AI IDEs to generate the backend and align frontend updates. It keeps the backend minimal where possible, but includes every feature that was agreed.

---

## 1) Scope and Principles

- Implement all planned features, but keep schema minimal.
- Prefer simple REST APIs; avoid premature microservices.
- Use the current Prisma schema as baseline and add only when required.
- Role-based access control (RBAC) is required.
- Indian municipal context is mandatory (wards, zones, local categories).

---

## 2) Tech Stack

- Runtime: Node.js
- Backend: Next.js App Router API routes (`app/api/...`)
- ORM: Prisma
- DB: PostgreSQL (Supabase)
- Auth: Email + password (JWT or NextAuth)
- File storage: Supabase Storage (complaint images)
- Notifications: In-app notifications (email optional)
- Maps: Mappls (MapMyIndia) or Google Maps for geocoding

---

## 3) Roles and Permissions (Simplified)

### Roles
- Citizen
- Officer
- Admin
- Supervisor (optional)

All municipal roles (Field Worker, Ward Officer, Dept Head, Zonal Officer, Commissioner) are represented as **Officer** for MVP. If you want one extra level, add **Supervisor** as a lightweight role for escalation visibility without expanding the full hierarchy. If needed later, extend `User.role` or add `User.roleType`.

---

## 4) Complaint Categories (India-Specific)

### Roads & Footpaths (PWD)
- Pothole, Road damage, Footpath broken, Speed breaker issue, Road marking faded, Waterlogging

### Water Supply (Jal Vibhag)
- No water, Low pressure, Contaminated water, Pipeline leakage, Meter issue, Illegal connection

### Sewerage & Drainage (Nali/Gatar)
- Blocked drain, Overflowing manhole, Sewage leak, Storm drain clogged, Bad odor

### Garbage & Sanitation (Solid Waste)
- Garbage not collected, Overflowing bin, Street sweeping, Dead animal removal, Public toilet

### Street Lighting (Electrical)
- Light not working, Pole damaged, New light request, Timer malfunction

### Property Tax & Assessment
- Wrong assessment, Payment issue, Name transfer, New assessment

### Building & Construction (Town Planning)
- Illegal construction, Encroachment, Dangerous structure, Plan approval

### Parks & Gardens
- Maintenance needed, Fallen tree, Equipment broken, Irrigation issue

### Traffic & Parking
- Illegal parking, Signal malfunction, Missing sign, Zebra crossing faded

### Health & Hygiene
- Mosquito breeding, Disease outbreak, Food safety, Stray animals

### Noise & Pollution
- Noise complaint, Air pollution, Water pollution, Construction dust

### Other
- General inquiry, Suggestion, Other issues

---

## 5) End-to-End Feature Flows

### A) Complaint Submission
1. Citizen submits complaint with category, description, location, images
2. System stores complaint, sets status PENDING
3. Timeline entry: "Complaint submitted"
4. Assign officer by ward + department
5. Notify citizen and officer

### B) SLA Escalation
1. SLA clock starts on creation
2. Reminder at 50 percent SLA
3. Escalate at 75 percent SLA
4. Breach at 100 percent -> admin escalation

### C) Duplicate Detection (Planned)
1. Compare location radius and text similarity
2. If duplicate, link to existing complaint and increment priority

### D) In-App AI Assistant (Phase 2)
1. Citizen describes issue in app
2. AI suggests category and priority
3. AI drafts a concise complaint summary for officers

---

## 6) Full Feature List (All Modules)

### Auth and Users
- Email + password login
- Role-based access control
- Profile view/edit

### Complaint Management
- Create complaint
- Complaint ID format (CR-YYYY-XXXXX)
- Track status
- Timeline view
- Upload photos
- Reopen complaint
- Comment thread (optional, can be added later)

### Officer Workflow
- Assigned queue
- Status updates
- Reassign to department or officer
- SLA countdown

### Admin Panel
- Department CRUD
- Category CRUD
- Ward/Zone management
- Officer onboarding
- SLA configuration

### Notifications
- In-app notification center
- Email notifications (optional)

### Analytics and Reporting
- Department performance
- Ward-wise heatmap
- Officer performance
- Category trends

### AI/Agentic Features (Phase 2 - Separate Module)
- In-app AI assistant (chatbot)
- Auto classification (text + image)
- Priority scoring
- Duplicate detection
- Smart routing
- Resolution verification (before/after photos)
- Analytics prediction

---

## 7) Database Models (Current Schema)

### Department
- id, name, email, phone, headId

### Category
- id, name, icon

### Ward
- id, name, zone

### User
- id, email, passwordHash, name, role, departmentId

### Complaint
- citizenId, categoryId, description, status, priority
- address, latitude, longitude, wardId
- departmentId, assignedOfficerId
- slaDeadline
- images[]
- timeline, feedback

### ComplaintTimeline
- complaintId, status, message, createdAt

### Notification
- userId, type, message, isRead

### Feedback
- complaintId, citizenId, rating, comment

---

## 8) Schema Extensions (If Needed Later)

Only add these if the related feature is actually implemented:

- `ComplaintComment` table for threaded discussion
- `ComplaintDuplicate` link table for duplicates
- `UserRoleDetails` table if granular role hierarchy needed
- `SlaConfig` table if SLA differs by category or priority

---

## 9) REST API Endpoints (Planned)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Complaints
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/complaints/:id`
- `PATCH /api/complaints/:id/status`
- `PATCH /api/complaints/:id/assign`

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

## 10) Implementation Order

1. Auth + RBAC
2. Reference data
3. Complaint creation + list
4. Status updates + timeline
5. Notifications
6. Feedback
7. Admin CRUD
8. Analytics
9. AI features

---

## 11) Notes for AI IDE

- Implement all features in this document
- Keep schema minimal and aligned to Prisma
- Add extension tables only when implementing their feature
- Maintain Indian municipal context in flows and data

---

This document is the single source of truth for backend generation.
