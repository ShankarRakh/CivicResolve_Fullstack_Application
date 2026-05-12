# Create Complaint - Technical Plan

This document defines the complete technical plan for implementing complaint creation, aligned with the finalized decisions and the current frontend.

---

## 1) Final Decisions (Locked)

- Store `subcategoryId` in DB.
- Store `displayId` in DB (format `CR-YYYY-XXXXX`).
- Store `wardId` (normalized). Ward text is fallback only.

---

## 2) API Design

### Endpoint
- `POST /api/complaints`

### Request Body
```json
{
  "categoryId": "roads",
  "subcategoryId": "pothole",
  "description": "Large pothole near Shivaji Chowk...",
  "priority": "MEDIUM",
  "address": "Near Shivaji Chowk, Hadapsar",
  "latitude": 18.5089,
  "longitude": 73.9259,
  "wardId": "ward-15",
  "images": ["https://.../img1.jpg", "https://.../img2.jpg"]
}
```

### Response Body
```json
{
  "id": "complaint-uuid",
  "displayId": "CR-2026-00042",
  "status": "PENDING",
  "slaDeadline": "2026-05-12T12:00:00.000Z"
}
```

---

## 3) Validation Rules

- `categoryId`: required
- `subcategoryId`: required
- `description`: min 20 chars
- `priority`: optional, defaults to `MEDIUM`
- `latitude` and `longitude`: must be both present if one is provided
- `images`: max 5 URLs

---

## 4) Database Changes

### Required Prisma Updates
- Add `displayId` to `Complaint` model (unique)
- Add `subcategoryId` to `Complaint` model (string)

### Suggested Schema (snippet)
```prisma
model Complaint {
  id            String   @id @default(cuid())
  displayId     String   @unique
  categoryId    String
  subcategoryId String
  ...
}
```

---

## 5) SLA Deadline Logic

- Use `subcategory.slaHours` from `CATEGORIES` in [lib/constants.ts](../lib/constants.ts).
- `slaDeadline = createdAt + slaHours`.

---

## 6) Timeline Entry

On creation, insert a timeline row:
- `status = "PENDING"`
- `message = "Complaint submitted"`

---

## 7) Notifications

Create notification for the citizen:
- `type = "status_update"`
- `message = "Complaint submitted"`

No SMS/WhatsApp.

---

## 7.1) Image Storage (Supabase Storage)

### Decision
- Use Supabase Storage buckets (1 GB free) to store complaint images.

### Why
- Free for MVP/demo
- Works cleanly with Supabase Postgres
- Public URLs can be saved directly in `complaints.images[]`

### Upload Flow (Plan)
1. Frontend uploads image(s) to Supabase Storage bucket `complaints`.
2. Supabase returns a public URL for each image.
3. Frontend sends those URLs in `images[]` to `POST /api/complaints`.
4. Backend stores URLs in DB.

### Notes
- Max 5 images per complaint (already enforced in UI).
- Use folder structure: `complaints/{userId}/{complaintId}/image-1.jpg`.
- If complaintId is not known yet, use `complaints/{userId}/temp/{uuid}.jpg` and move/rename after creation (optional).

---

## 8) Frontend Integration (Citizen)

### File
- [app/citizen/complaints/new/page.tsx](../app/citizen/complaints/new/page.tsx)

### Changes
- Replace mock submit delay with API call.
- Map UI state into API payload.
- Use returned `displayId` for success screen.

---

## 9) Ward Mapping

Frontend currently stores only ward text (e.g., "Ward 15").

Recommended approach:
- Populate a selectable ward list with IDs.
- Send `wardId` from selection.

Fallback:
- If ward ID is not available, keep null and store only address.

---

## 10) Implementation Steps

1. Update Prisma schema with `displayId` + `subcategoryId`.
2. Migrate DB.
3. Implement `POST /api/complaints` route.
4. Wire frontend submit to the API.
5. Replace mock success state with API response.

---

This document is the single technical blueprint for the complaint creation feature.
