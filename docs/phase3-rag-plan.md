# Phase 3: FAQ RAG Implementation Plan

## Goal
Implement a Retrieval-Augmented Generation (RAG) pipeline to allow the chatbot to answer general policy, SLA, and platform usage questions accurately using trusted documentation, without hallucinating.

## Architecture & Technology
1.  **Vector Database:** Supabase Postgres with the `pgvector` extension.
2.  **Embeddings Model:** Google Gemini `text-embedding-004` (or standard Gemini embedding models).
3.  **LLM:** `gemini-2.5-flash` for answering the prompt using retrieved context.
4.  **Framework:** Next.js API Routes (`/api/ai/faq`).

## Step-by-Step Implementation

### Step 1: Database Setup (pgvector)
We need to enable the `pgvector` extension in Supabase and create a table to store our document chunks.
1.  Create a Supabase migration to:
    *   Enable the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`).
    *   Create a `document_chunks` table with `id`, `content`, `metadata` (JSONB), and `embedding` (`vector(768)` for Gemini embeddings).
    *   Create a function `match_document_chunks` for cosine similarity search (to be called via Supabase RPC).

### Step 2: Knowledge Base Preparation
1.  Create a `docs/ai/` directory in the repository.
2.  Write/gather markdown files containing the knowledge base:
    *   `faq.md` (General usage questions)
    *   `sla.md` (Expected resolution times per category)
    *   `photo-guidelines.md` (How to take good evidence photos)
3.  Create an ingestion script (`scripts/ingest-docs.ts`) to:
    *   Read the markdown files.
    *   Chunk the text into logical sections (e.g., splitting by markdown headings).
    *   Call the Gemini Embeddings API to generate vectors.
    *   Insert the chunks and vectors into the Supabase `document_chunks` table.

### Step 3: FAQ API Endpoint (`/api/ai/faq`)
1.  Create a new Next.js route: `app/api/ai/faq/route.ts`.
2.  **Input:** Accepts a user `query` (string).
3.  **Embedding:** Calls Gemini to generate an embedding for the user's query.
4.  **Retrieval:** Calls the Supabase `match_document_chunks` RPC function to retrieve the top 3 most relevant chunks based on vector similarity.
5.  **Relevance Check:** If the similarity score is too low (e.g., < 0.7), instantly return an "Out of Scope" response: *"Please ask a complaint-related question."*
6.  **Generation:** If relevant chunks exist, inject them into a strict System Prompt telling Gemini to answer *only* using the provided context.
7.  **Output:** Return the generated answer and a list of sources.

### Step 4: Chat Widget Integration
1.  Update `components/ai/chat-widget.tsx`.
2.  Enhance the intent detection in `handleSubmit`:
    *   We will add a fast LLM classification step (or robust regex) to distinguish between "Question" vs "Complaint Draft".
    *   If it's a question, call the `/api/ai/faq` endpoint.
3.  Display the RAG answer in the chat UI, optionally showing the source document name as a footnote.

## Definition of Done
*   The chatbot can accurately answer questions like "What is the SLA for a pothole?" or "How do I upload a photo?" based on the markdown files.
*   The chatbot politely declines to answer general knowledge questions (e.g., "What is the capital of France?").
*   The UI seamlessly integrates these answers into the chat history.
