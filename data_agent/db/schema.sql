CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ski_knowledge_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash    TEXT NOT NULL UNIQUE,
    source_type     TEXT NOT NULL,
    source_url      TEXT NOT NULL,
    source_title    TEXT,
    chunk_index     INTEGER NOT NULL,
    chunk_text      TEXT NOT NULL,
    metadata        JSONB,
    embedding       VECTOR(768),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ski_chunks_embedding_idx
    ON ski_knowledge_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS ski_chunks_source_url_idx
    ON ski_knowledge_chunks (source_url);

CREATE INDEX IF NOT EXISTS ski_chunks_content_hash_idx
    ON ski_knowledge_chunks (content_hash);
