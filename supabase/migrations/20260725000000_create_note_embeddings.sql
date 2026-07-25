-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Note Embeddings Table for BCA Notes & Ingested Materials
CREATE TABLE IF NOT EXISTS public.note_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id TEXT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding vector(768), -- Dimension for text-embedding-004
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast vector similarity search using HNSW
CREATE INDEX IF NOT EXISTS note_embeddings_vector_idx 
ON public.note_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Index for filtering by semester and subject in JSONB metadata
CREATE INDEX IF NOT EXISTS note_embeddings_metadata_idx 
ON public.note_embeddings 
USING gin (metadata);

-- Similarity Search RPC Function filtered strictly by Semester and Subject
CREATE OR REPLACE FUNCTION public.match_note_embeddings(
    query_embedding vector(768),
    filter_semester TEXT,
    filter_subject TEXT,
    match_threshold FLOAT DEFAULT 0.25,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    doc_id TEXT,
    chunk_content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ne.id,
        ne.doc_id,
        ne.chunk_content,
        ne.metadata,
        1 - (ne.embedding <=> query_embedding) AS similarity
    FROM public.note_embeddings ne
    WHERE (1 - (ne.embedding <=> query_embedding)) > match_threshold
      AND (ne.metadata->>'semester' = filter_semester OR filter_semester IS NULL OR filter_semester = 'all')
      AND (ne.metadata->>'subject' = filter_subject OR filter_subject IS NULL OR filter_subject = 'all')
    ORDER BY ne.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
