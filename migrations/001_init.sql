-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (replaces in-memory _USER_STORE)
CREATE TABLE IF NOT EXISTS users (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    email                 TEXT NOT NULL,
    sport                 TEXT NOT NULL DEFAULT 'Skier',
    skill_level           TEXT NOT NULL DEFAULT 'intermediate',
    preferred_equipment   TEXT NOT NULL DEFAULT 'skis',
    preferred_terrain     TEXT NOT NULL DEFAULT 'hybrid',
    skier_type            INT,
    birthday              DATE,
    weight_kg             NUMERIC(6,2),
    height_cm             NUMERIC(6,2),
    boot_sole_length_mm   INT,
    din                   NUMERIC(4,1) NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL,
    updated_at            TIMESTAMPTZ NOT NULL
);

-- Ski knowledge chunks table (for data_agent RAG pipeline)
CREATE TABLE IF NOT EXISTS ski_knowledge_chunks (
    id            BIGSERIAL PRIMARY KEY,
    content_hash  TEXT UNIQUE NOT NULL,
    source_type   TEXT,
    source_url    TEXT,
    source_title  TEXT,
    chunk_index   INT,
    chunk_text    TEXT,
    metadata      JSONB,
    embedding     vector(768)
);

CREATE INDEX IF NOT EXISTS ski_knowledge_chunks_embedding_idx
    ON ski_knowledge_chunks USING hnsw (embedding vector_cosine_ops);
