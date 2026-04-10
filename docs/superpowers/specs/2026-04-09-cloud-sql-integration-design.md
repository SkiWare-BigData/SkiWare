# Cloud SQL Integration Design
**Date:** 2026-04-09
**Scope:** Wire backend to Cloud SQL, run data_agent RAG pipeline against Cloud SQL, add local dev PostgreSQL

---

## Context

The backend currently uses an in-memory dict (`_USER_STORE`) with no persistence. The `data_agent` RAG pipeline is fully scaffolded but has never run against a live database. A Cloud SQL instance (`skiware-db`, PostgreSQL 15, `us-central1-c`) already exists with a `skiware` database and IAM user `maca6216@colorado.edu`.

---

## Goals

1. Replace in-memory user store with Cloud SQL persistence
2. Run the data_agent ingestion pipeline against Cloud SQL (populate `ski_knowledge_chunks`)
3. Add local Docker PostgreSQL so teammates can develop without GCP access

---

## Database Schema (`migrations/001_init.sql`)

Single migration file applied once against both local and Cloud SQL.

### Users table
```sql
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
    din                   NUMERIC(4,1),
    created_at            TIMESTAMPTZ NOT NULL,
    updated_at            TIMESTAMPTZ NOT NULL
);
```

### Knowledge chunks table (data_agent)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

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
```

---

## Connection Layer

`backend/db/connection.py` branches on environment:

- **Local Docker** (`DB_HOST` set): direct TCP via pg8000 — `pg8000.connect(host, db, user, password)`
- **Cloud SQL** (`CLOUD_SQL_INSTANCE` set): Cloud SQL Python Connector + pg8000 with `enable_iam_auth=True`

The data_agent's `connection.py` already supports this same pattern (Connector + IAM). The backend adds the local TCP branch for Docker dev.

A connection is created once at FastAPI startup (`lifespan`) and injected into service functions. No connection pool needed at this scale.

---

## Backend Changes

**New files:**
- `backend/db/__init__.py`
- `backend/db/connection.py` — `get_connection()` using Cloud SQL Connector

**Modified files:**
- `backend/services/users.py` — replace `_USER_STORE` dict with SQL (pg8000 cursor). Function signatures stay the same; routers unchanged.
- `backend/main.py` — add `lifespan` context manager to open/close connection
- `requirements.txt` — add `cloud-sql-python-connector[pg8000]`

**Column mapping** (camelCase model → snake_case SQL):

| Model field | DB column |
|---|---|
| `skillLevel` | `skill_level` |
| `preferredEquipment` | `preferred_equipment` |
| `preferredTerrain` | `preferred_terrain` |
| `skierType` | `skier_type` |
| `weightKg` | `weight_kg` |
| `heightCm` | `height_cm` |
| `bootSoleLengthMm` | `boot_sole_length_mm` |
| `DIN` | `din` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

---

## data_agent Pipeline

No code changes needed. Requires these env vars set before running:

```
CLOUD_SQL_INSTANCE=skiware:us-central1:skiware-db
DB_NAME=skiware
DB_USER=maca6216@colorado.edu        # local dev
# DB_USER=skiware-app@skiware.iam.gserviceaccount.com  # Cloud Run
GOOGLE_API_KEY=<gemini api key>
```

Run with: `python -m data_agent`

---

## Local Dev

`docker-compose.yml` gains a `postgres` service:

```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: skiware
    POSTGRES_USER: skiware
    POSTGRES_PASSWORD: skiware
  ports:
    - "5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U skiware"]
    interval: 5s
    timeout: 5s
    retries: 5
```

The `app` service gets env vars:
```yaml
DB_HOST=postgres
DB_NAME=skiware
DB_USER=skiware
DB_PASSWORD=skiware
```

`.env.example` documents all vars for both local and Cloud SQL modes.

Teammates workflow:
1. `docker compose up`
2. Apply migration: `psql $DATABASE_URL -f migrations/001_init.sql`
3. Run backend: already handled by docker compose

---

## GCP / Cloud Run Changes

### New app service account
Name: `skiware-app`
Role: `roles/cloudsql.client`

The deploy SA (`github-actions-deployer`) needs `roles/iam.serviceAccountUser` on `skiware-app` to deploy as it.

### Updated deploy workflow
Add to `gcloud run deploy`:
```bash
--add-cloudsql-instances skiware:us-central1:skiware-db
--service-account skiware-app@skiware.iam.gserviceaccount.com
--set-env-vars CLOUD_SQL_INSTANCE=skiware:us-central1:skiware-db,DB_NAME=skiware,DB_USER=skiware-app@skiware.iam.gserviceaccount.com
```

---

## Environment Variables Reference

| Variable | Local dev | Cloud Run |
|---|---|---|
| `CLOUD_SQL_INSTANCE` | not needed | `skiware:us-central1:skiware-db` |
| `DB_HOST` | `postgres` (docker) | not used |
| `DB_NAME` | `skiware` | `skiware` |
| `DB_USER` | `skiware` | `skiware-app@skiware.iam.gserviceaccount.com` |
| `DB_PASSWORD` | `skiware` | not set (triggers IAM auth) |
| `GOOGLE_API_KEY` | your key | set as secret |

---

## Out of Scope

- RAG query endpoint (future work — knowledge base populated here, query endpoint comes later)
- Alembic migrations (single SQL file sufficient at this scale)
- Connection pooling (single connection at startup is fine for now)
