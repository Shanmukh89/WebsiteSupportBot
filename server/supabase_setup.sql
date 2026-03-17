-- Enable the pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Add agent status tracking
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

-- 2. Add explicit agent_id to chunks for strict isolation
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE;

-- Backfill agent_id for existing chunks (if any)
UPDATE public.knowledge_chunks kc
SET agent_id = ks.agent_id
FROM public.knowledge_sources ks
WHERE kc.source_id = ks.id AND kc.agent_id IS NULL;

-- 3. Recreate the match_chunks RPC function for vector similarity search WITH STRICT ISOLATION
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_agent_id uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.agent_id = match_agent_id
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
