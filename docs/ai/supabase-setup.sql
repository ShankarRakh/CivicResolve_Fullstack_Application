-- 1. Enable the pgvector extension
create extension if not exists vector;

-- Drop existing table and function if they exist from a previous attempt
drop function if exists match_document_chunks;
drop table if exists document_chunks;

-- 2. Create a clean table to store your documents
create table document_chunks (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(768) -- Gemini embeddings use 768 dimensions
);

-- 3. Create a function to search for documents via cosine similarity
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
