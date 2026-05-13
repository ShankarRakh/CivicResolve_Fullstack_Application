# Officer Workflow - Implementation Plan

## 1. Overview

The Officer Workflow empowers municipal officers to view, manage, and resolve citizen complaints assigned to them. The goal is to replace the current frontend mock data (`MOCK_COMPLAINTS`) with real database interactions via simple, robust REST APIs using Next.js App Router and Prisma.

## 2. Key Features to Implement

- **Officer Dashboard (`/officer`)**: Display real-time statistics (Pending Tasks, Resolved Today, SLA Breached, Urgent Alerts).
- **Complaint Queue (`/officer/queue`)**: List all complaints assigned to the logged-in officer.
- **Complaint Management (`/officer/queue/[id]`)**: Allow officers to update the status of a complaint (e.g., from `PENDING` to `IN_PROGRESS` to `RESOLVED`).
- **Timeline & Notifications**: Every status change must add an entry to the `ComplaintTimeline` and trigger an in-app `Notification` for the citizen.

## 3. Database Schema Interactions

- **`Complaint`**: Fetch based on `assignedOfficerId`. Update `status` field.
- **`ComplaintTimeline`**: Insert a new record whenever an officer updates the complaint status.
- **`Notification`**: Insert a new record to notify the citizen of the status change.
- **`User`**: Verify the requesting user has the `OFFICER` role.

## 4. API Endpoints Required

### A. `GET /api/complaints` (Update existing or create new)

- **Purpose**: Fetch complaints relevant to the logged-in user.
- **Logic**:
  - Authenticate using `verifyToken`.
  - If user `role === 'OFFICER'`, fetch `prisma.complaint.findMany` where `assignedOfficerId === payload.userId`.
  - Include relations: `category`, `ward`, `timeline` to match frontend requirements.

### B. `PATCH /api/complaints/[id]/status` (New Endpoint)

- **Purpose**: Allow officers to progress the complaint.
- **Request Body**: `{ "status": "IN_PROGRESS" | "RESOLVED" | "REJECTED", "message": "Optional resolution note" }`
- **Logic**:
  - Authenticate and verify user is an `OFFICER`.
  - Use `prisma.$transaction` to:
    1. Update the complaint's `status` and `updatedAt`.
    2. Create a `ComplaintTimeline` entry with the new status and message.
    3. Create a `Notification` for the citizen (`citizenId`) informing them of the update.

## 5. Frontend Integration Steps

1.  **Data Fetching**: Replace the static `MOCK_COMPLAINTS` import in `app/officer/page.tsx` and `app/officer/queue/page.tsx` with a `useEffect` or React Query hook fetching from `/api/complaints`.
2.  **Dashboard Stats**: Dynamically calculate "Resolved Today", "SLA Breached", and "Pending Tasks" using the API response.
3.  **Status Updates**: In the individual complaint view, wire the "Update Status" buttons to send a `PATCH` request to `/api/complaints/[id]/status`.
4.  **Error Handling**: Add simple toast notifications for successful status updates or API errors.

## 6. Execution Strategy for AI Agent

1. **Backend First**: Create the `PATCH /api/complaints/[id]/status` route and ensure it properly handles the Prisma transaction (Status update + Timeline + Notification).
2. **Read Logic**: Update the existing `GET /api/complaints` to return the correct records for the Officer role.
3. **Frontend Wiring**: Modify `app/officer/page.tsx` to consume the new APIs. Remove mock data dependencies.
4. **Validation**: Ensure type safety matches the frontend interfaces and Prisma schema. Keep everything minimal and avoid over-engineering.
