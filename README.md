# CivicResolve

CivicResolve is a full-stack municipal grievance platform that lets citizens file complaints with precise map-based locations, attach evidence, and track resolution. Officers receive assigned queues, update status, and attach resolution proof. An in-app AI assistant drafts complaints, explains status in friendly language, and answers FAQs using RAG.

## Highlights
- AI-assisted complaint drafting with clarifying questions and guidance.
- Status explanation with department, officer, and SLA context.
- Map-based location selection (Leaflet) + optional geocoding.
- Duplicate detection with vector embeddings to reduce repeat reports.
- Officer workflows for status updates and resolution proof.
- Supabase storage for complaint images.

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind, Radix UI
- Backend: Next.js API routes, Prisma ORM
- Database: PostgreSQL (Supabase), pgvector for embeddings
- AI: Google Gemini (text + embeddings)
- Maps: Leaflet + OpenStreetMap tiles
- Storage: Supabase Storage

## Features
- Complaint creation with SLA tracking and auto-assignment to officers
- Complaint timeline and notifications
- AI chatbot for drafting, status explanations, and FAQ RAG
- Duplicate complaint detection and upvote linking
- Officer queue + resolution upload

## Project Structure
- app/ - Next.js routes and API endpoints
- components/ - UI components and chat widget
- prisma/ - Schema and seed scripts
- lib/ - Shared helpers (auth, prisma, AI, storage)
- docs/ - Design and feature plans

## Running Locally

### 1) Install dependencies
```bash
pnpm install
```

### 2) Configure environment
Create a `.env` file in the project root:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_GENAI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3) Prisma setup
```bash
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
```

### 4) Start the app
```bash
pnpm dev
```

App runs on http://localhost:3000

## AI + RAG Setup
- The assistant uses Gemini for complaint drafting and status explanations.
- FAQ RAG uses vector search in Supabase (pgvector).
- See docs/phase3-rag-plan.md for the SQL functions used by RAG.

## Duplicate Detection
- New complaints generate embeddings and store them in `complaints.embedding`.
- The duplicate check endpoint calls a SQL function `match_complaints`.
- Ensure pgvector is enabled in your database.

## Maps
- Leaflet is used for map selection.
- Location can be set by map click, search, or current GPS.

## Scripts
```bash
pnpm db:seed
```
Additional scripts are in the scripts/ folder (ward normalization, seeding officers, DB checks).

## Deployment
- Set environment variables in your hosting provider.
- Build and start:
```bash
pnpm build
pnpm start
```

## Contributing
- Keep API responses consistent with existing Zod schemas.
- Avoid breaking the chat contract: complaint draft and status endpoints must return JSON.

## License
MIT
