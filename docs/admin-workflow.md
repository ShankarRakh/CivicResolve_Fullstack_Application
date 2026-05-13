# Admin Panel Workflow - Implementation Plan

## 1. Overview

The Admin Panel is the central hub for municipal administrators to monitor overall system performance, manage departments and officers, and oversee citizen complaints. The goal is to replace static mock data with real API responses in a **simple and robust way**.

## 2. Key Features to Implement

- **Global Dashboard (`/admin`)**: High-level metrics, simple charts (Category breakdown), and top officers.
- **Global Complaint Queue (`/admin/complaints`)**: Unrestricted view of all complaints.
- **User/Officer Management (`/admin/users`)**: **Crucial Feature** - Ability to view existing officers and onboard new ones by providing their credentials (name, email, phone, role, department, and password).
- **Department Management (`/admin/departments`)**: Basic view of departments and their performance.

## 3. Database Schema Interactions

- **`Complaint`**: Fetch records or use simple `count` queries for dashboard statistics.
- **`User`**: Create new officers. Query users to display the officer list.
- **`Department`**: Fetch list of departments to assign to new officers.

## 4. API Endpoints Required (Keep it Simple!)

### A. `GET /api/admin/stats` (New Endpoint)

- **Purpose**: Power the main admin dashboard charts and top-level numbers.
- **Logic (Simplified)**:
  - Verify user `role === 'ADMIN'`.
  - Fetch basic counts: `total`, `pending`, `resolved`.
  - For charts (like Category Distribution), you can either use Prisma's `groupBy` OR simply fetch the recent complaints and group them in memory using JavaScript to keep the Prisma queries straightforward and easy to debug.

### B. User Management API (New Endpoints)

- **`GET /api/admin/users`**:
  - Fetch all users where `role === 'OFFICER'` or `ADMIN`.
  - Include basic stats (e.g., how many complaints are assigned to them) to show "Top Performing Officers".
- **`POST /api/admin/users`**:
  - **Purpose**: Onboard a new officer.
  - **Payload**: `{ name, email, phone, password, role, departmentId }`.
  - **Logic**:
    1. Verify Admin access.
    2. Hash the provided `password` (e.g., using `bcryptjs`).
    3. Create the new `User` in the database.

### C. `GET /api/complaints` (Update existing)

- **Logic Update**:
  - If the authenticated user is an `ADMIN`, bypass the `assignedOfficerId` filter so they receive _all_ complaints in the system.

## 5. Frontend Integration Steps

1.  **User Management (`app/admin/users`)**:
    - Create a simple form to add a new officer. It should collect: Name, Email, Phone, Password, Role (Officer/Admin), and Department.
    - Submit this form to `POST /api/admin/users`.
    - Display a table of existing officers fetched from `GET /api/admin/users`.
2.  **Dashboard Wiring (`app/admin/page.tsx`)**:
    - Remove imports for `MOCK_COMPLAINTS` and `MOCK_OFFICERS`.
    - Call `/api/admin/stats` and map the simple JSON response directly to the dashboard metric cards and the Category Pie Chart.
3.  **Complaints List (`app/admin/complaints/page.tsx`)**:
    - Fetch from `/api/complaints` to show the global list.

## 6. Execution Strategy for AI Agent

1. **Security First**: Ensure all new `/api/admin/*` routes strictly check that the JWT token belongs to an `ADMIN`.
2. **Officer Onboarding**: Build the `POST /api/admin/users` route first. This is highly important so admins can populate the system with staff. Remember to hash the password!
3. **Keep Analytics Simple**: Do not over-engineer the stats endpoint. If complex SQL/Prisma aggregations cause errors, fallback to fetching records and calculating the stats (like SLA compliance or weekly trends) via standard JavaScript array methods (`.filter()`, `.reduce()`).
4. **Frontend Wiring**: Connect the UI components to these new APIs one by one, ensuring you replace the mock data entirely.
