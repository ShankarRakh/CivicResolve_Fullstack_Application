# AI-Assisted Citizen Bot Plan (Phase 2)

## Goal
Build an in-app assistant that helps citizens file complaints faster, explains complaint status in plain language, and answers general FAQs using RAG. No optional/high-complexity features (image classification, duplicate detection, smart routing) are included.

## Scope (Included)
1) Complaint Drafting + Form Auto-Fill
2) Status Explainer (no LLM SQL; uses cached complaint data or existing APIs)
3) General Help / FAQ via RAG
4) Lightweight guidance (photo checklist, description quality tips)

## Out of Scope (Skipped)
- Image-based classification
- Duplicate detection
- Smart routing to officers
- Resolution verification (before/after photos)
- Voice/IVR

---

## User Experience (UX)
- Floating chat button on citizen pages (bottom-right).
- Opens a panel with quick actions:
  - "File a complaint"
  - "Track my complaint"
  - "Explain my status"
  - "General help"
- When filing, bot shows a structured summary and “Confirm / Edit / Cancel” buttons.
- Keep responses short; never auto-submit without user confirmation.

---

## Feature Details

### 1) Complaint Drafting + Auto-Fill (LLM + Rules)
**Purpose:** Convert free-text into structured complaint fields.

**Inputs:**
- User message
- Category + subcategory list (lib/constants.ts)

**Output:**
- categoryId
- subcategoryId
- priority
- description (cleaned)
- optional: landmark suggestion

**Flow:**
1. User describes issue.
2. LLM suggests category/subcategory + priority.
3. Show summary to user.
4. On confirm, auto-fill complaint form.

**Validation:**
- Use Zod to validate LLM JSON.
- If invalid/low confidence: ask clarifying question.

**Complexity:** Medium

---

### 2) Status Explainer (No LLM SQL)
**Purpose:** Explain complaint status and SLA in plain terms.

**Data Source:**
- Use cached complaints from `/api/complaints` or `/api/complaints?limit=3`.
- If missing: fetch `/api/complaints/[id]`.

**Logic:**
- Map status to explanation text.
- Include SLA deadline if present.
- Explain next expected step.

**Complexity:** Low

---

### 3) General Help / FAQ (RAG)
**Purpose:** Answer policy/FAQ questions from trusted docs.

**Data Source:**
- Markdown docs stored in `docs/ai/` (new folder).

**RAG Flow:**
1. Embed docs chunks.
2. Retrieve top-k chunks.
3. LLM answers using only retrieved context.
4. If no relevant context, respond: "I don’t have that info yet."

**Complexity:** Medium

---

### 4) Lightweight Guidance (Heuristics)
**Purpose:** Improve complaint quality without heavy AI.

**Examples:**
- If description < 20 chars → ask for more details.
- If no photo → suggest adding a wide + close shot.

**Complexity:** Low

---

## Architecture

### Frontend
- Chat widget component (React) mounted on citizen pages.
- Local conversation state.
- Action buttons for common flows.
- Form auto-fill via shared state or context.

### Backend
- `/api/ai/chat` (router): orchestrates the flow.
- `/api/ai/complaint-draft`: LLM classification + structured output.
- `/api/ai/faq`: RAG retrieval + response.

### Data Contracts
#### Complaint Draft Response
```
{
  "categoryId": "roads",
  "subcategoryId": "pothole",
  "priority": "HIGH",
  "description": "...",
  "confidence": 0.78,
  "clarifyingQuestion": null
}
```

#### Status Explainer Response
```
{
  "complaintId": "...",
  "displayId": "CR-2026-00008",
  "status": "PENDING",
  "explanation": "Your complaint is in queue. It will be assigned soon...",
  "slaDeadline": "..."
}
```

#### FAQ Response
```
{
  "answer": "...",
  "sources": ["faq/complaints.md#sla", "faq/photos.md#tips"]
}
```

---

## Data Needed
- Category + subcategory list (already in `lib/constants.ts`).
- Complaint list/detail endpoints (already implemented).
- RAG documents (new `docs/ai/`):
  - `faq.md`
  - `sla.md`
  - `photo-guidelines.md`
  - `complaint-process.md`

---

## Implementation Steps (Suggested Order)

### Phase 1: Status Explainer (No LLM)
1. Add chat UI shell + quick actions.
2. Implement a client-only status explainer using cached complaints.
3. Add fallback fetch to `/api/complaints/[id]`.

### Phase 2: Complaint Drafting
1. Add `/api/ai/complaint-draft` endpoint.
2. LLM outputs JSON; validate with Zod.
3. Add confirmation UI; map fields into form state.

### Phase 3: FAQ RAG
1. Add `docs/ai/` markdown sources.
2. Build embedding + vector storage (Supabase + pgvector).
3. Add `/api/ai/faq` to retrieve + answer.

### Phase 4: Polish
- Language detection (optional).
- Better error messages and clarifying prompts.

---

## Complexity Summary
- Complaint drafting: Medium
- Status explainer: Low
- RAG FAQ: Medium
- Heuristic guidance: Low

---

## Testing Checklist
- Chat widget loads on citizen pages.
- Status explainer uses cached complaints and fallback works.
- Complaint draft returns valid JSON and fills form.
- FAQ answers match docs and refuse if no source.
- No auto-submit without user confirmation.

---

## Notes
- Avoid LLM-generated SQL.
- Always validate LLM output with Zod.
- All citizen complaint submissions still go through existing `/api/complaints`.
- Keep the bot as a separate module so officer backend can be added later.
