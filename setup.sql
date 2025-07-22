-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents metadata table
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  chunks INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document chunks with embeddings
CREATE TABLE document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  embedding vector(768) -- Dimension for Google's embedding-001 model
);

CREATE TABLE partner_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Function for document chunk similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    document_id,
    content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;