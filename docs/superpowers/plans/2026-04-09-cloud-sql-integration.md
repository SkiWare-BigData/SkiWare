# Cloud SQL Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory user store with Cloud SQL, run the data_agent RAG pipeline against Cloud SQL, and add local Docker PostgreSQL for teammate dev.

**Architecture:** The backend gains a `backend/db/connection.py` module that branches on env vars — Cloud SQL Connector + IAM auth when `CLOUD_SQL_INSTANCE` is set, direct pg8000 TCP when `DB_HOST` is set (Docker). Service functions import `get_db()` internally so router signatures stay unchanged. A single `migrations/001_init.sql` creates both the `users` table and the `ski_knowledge_chunks` table (with pgvector).

**Tech Stack:** pg8000, cloud-sql-python-connector, pgvector/pgvector:pg15 (Docker), GCP Cloud SQL PostgreSQL 15, Vertex AI text-embedding-004 (replaces Gemini API key — uses IAM auth)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `migrations/001_init.sql` | Create | Schema: users + ski_knowledge_chunks + pgvector |
| `data_agent/pipeline/embedder.py` | Modify | Swap google-generativeai → Vertex AI (IAM auth, no API key) |
| `data_agent/requirements.txt` | Modify | Replace google-generativeai with google-cloud-aiplatform |
| `backend/db/__init__.py` | Create | Package marker |
| `backend/db/connection.py` | Create | `init_connection()`, `get_db()`, `close_connection()` |
| `backend/services/users.py` | Modify | Replace `_USER_STORE` dict with SQL |
| `backend/main.py` | Modify | Add `lifespan` context manager |
| `requirements.txt` | Modify | Add `cloud-sql-python-connector[pg8000]` and `pg8000` |
| `tests/conftest.py` | Create | Session-scoped DB fixture for tests |
| `docker-compose.yml` | Modify | Add postgres service + env vars for app |
| `.env.example` | Create | Document all env vars |
| `.github/workflows/deploy.yml` | Modify | Add Cloud SQL flags to Cloud Run deploy |

---

### Task 1: GCP Service Account Setup

**Files:** none (gcloud commands only)

- [ ] **Step 1: Create the app service account**

```bash
gcloud iam service-accounts create skiware-app \
  --display-name="SkiWare App" \
  --project=skiware
```

Expected output: `Created service account [skiware-app].`

- [ ] **Step 2: Grant Cloud SQL Client role**

```bash
gcloud projects add-iam-policy-binding skiware \
  --member="serviceAccount:skiware-app@skiware.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet
```

- [ ] **Step 3: Add as Cloud SQL IAM user**

```bash
gcloud sql users create skiware-app@skiware.iam.gserviceaccount.com \
  --instance=skiware-db \
  --type=CLOUD_IAM_SERVICE_ACCOUNT
```

Expected output: `Created user [skiware-app@skiware.iam.gserviceaccount.com].`

- [ ] **Step 4: Allow the deploy SA to act as the app SA**

```bash
gcloud iam service-accounts add-iam-policy-binding \
  skiware-app@skiware.iam.gserviceaccount.com \
  --member="serviceAccount:github-actions-deployer@skiware.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

- [ ] **Step 5: Verify all users on the instance**

```bash
gcloud sql users list --instance=skiware-db
```

Expected: three rows — `postgres`, `maca6216@colorado.edu`, `skiware-app@skiware.iam.gserviceaccount.com`

- [ ] **Step 6: Commit**

```bash
git commit --allow-empty -m "chore: provision skiware-app service account for Cloud SQL"
```

---

### Task 2: Database Migration File

**Files:**
- Create: `migrations/001_init.sql`

- [ ] **Step 1: Create the migrations directory and SQL file**

Create `migrations/001_init.sql` with this exact content:

```sql
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
```

- [ ] **Step 2: Set the postgres password on the Cloud SQL instance (needed for psql access)**

```bash
gcloud sql users set-password postgres \
  --instance=skiware-db \
  --password="Skiware2024!"
```

- [ ] **Step 3: Apply the migration to Cloud SQL via gcloud sql connect**

```bash
PATH="/opt/homebrew/Cellar/libpq/18.3/bin:$PATH" \
  gcloud sql connect skiware-db --user=postgres --database=skiware \
  < migrations/001_init.sql
```

When prompted for password, enter: `Skiware2024!`

Expected output ends with: `CREATE INDEX`

- [ ] **Step 4: Commit**

```bash
git add migrations/001_init.sql
git commit -m "feat: add database migration for users and ski_knowledge_chunks tables"
```

---

### Task 3: Backend Connection Module

**Files:**
- Create: `backend/db/__init__.py`
- Create: `backend/db/connection.py`
- Modify: `requirements.txt`

- [ ] **Step 1: Add dependencies to requirements.txt**

Current `requirements.txt`:
```
fastapi==0.115.6
httpx==0.28.1
uvicorn[standard]==0.32.1
```

New `requirements.txt`:
```
fastapi==0.115.6
httpx==0.28.1
uvicorn[standard]==0.32.1
cloud-sql-python-connector[pg8000]==1.12.1
pg8000==1.31.2
```

- [ ] **Step 2: Create `backend/db/__init__.py`**

```python
```

(Empty file — package marker only.)

- [ ] **Step 3: Create `backend/db/connection.py`**

```python
import os
import logging

import pg8000
import pg8000.dbapi

logger = logging.getLogger(__name__)

_conn: pg8000.dbapi.Connection | None = None
_connector = None  # google.cloud.sql.connector.Connector, kept for cleanup


def init_connection() -> None:
    """Open the DB connection. Branches on env vars:
    - CLOUD_SQL_INSTANCE set → Cloud SQL Connector + IAM auth
    - DB_HOST set → direct TCP (local Docker dev / tests)
    """
    global _conn, _connector

    cloud_sql_instance = os.environ.get("CLOUD_SQL_INSTANCE")
    db_name = os.environ.get("DB_NAME", "skiware")

    if cloud_sql_instance:
        from google.cloud.sql.connector import Connector

        db_user = os.environ["DB_USER"]
        password = os.environ.get("DB_PASSWORD")

        _connector = Connector()
        kwargs: dict = {"db": db_name, "user": db_user}
        if password:
            kwargs["password"] = password
        else:
            kwargs["enable_iam_auth"] = True

        logger.info(f"Connecting via Cloud SQL Connector to {cloud_sql_instance} as {db_user}")
        _conn = _connector.connect(cloud_sql_instance, "pg8000", **kwargs)

    else:
        db_host = os.environ.get("DB_HOST", "localhost")
        db_user = os.environ.get("DB_USER", "skiware")
        db_password = os.environ.get("DB_PASSWORD", "skiware")
        db_port = int(os.environ.get("DB_PORT", "5432"))

        logger.info(f"Connecting via TCP to {db_host}:{db_port}/{db_name} as {db_user}")
        _conn = pg8000.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port,
        )


def get_db() -> pg8000.dbapi.Connection:
    """Return the active connection. Raises if init_connection() was not called."""
    if _conn is None:
        raise RuntimeError("DB connection not initialized — call init_connection() first")
    return _conn


def close_connection() -> None:
    """Close the DB connection and Cloud SQL Connector if open."""
    global _conn, _connector
    if _conn is not None:
        try:
            _conn.close()
        except Exception:
            pass
        _conn = None
    if _connector is not None:
        try:
            _connector.close()
        except Exception:
            pass
        _connector = None
```

- [ ] **Step 4: Commit**

```bash
git add backend/db/__init__.py backend/db/connection.py requirements.txt
git commit -m "feat: add backend DB connection module with Cloud SQL Connector support"
```

---

### Task 4: Refactor backend/services/users.py

**Files:**
- Modify: `backend/services/users.py`

- [ ] **Step 1: Run existing tests to confirm the current baseline passes**

```bash
cd /Users/Matthew/Desktop/CompSci/SkiWare && pip install -r requirements.txt -q && pytest tests/ -v --tb=short 2>&1 | tail -20
```

Expected: all tests pass (they still use the in-memory store).

- [ ] **Step 2: Replace the entire contents of `backend/services/users.py`**

```python
from datetime import date
from typing import Any

import pg8000.dbapi
from pydantic import ValidationError

from backend.db.connection import get_db
from backend.models.user import UserListResponse, UserResponse, UserWrite
from backend.services.calculate_DIN import calculate_din

_SELECT_COLS = (
    "id, name, email, sport, skill_level, preferred_equipment, preferred_terrain, "
    "skier_type, birthday, weight_kg, height_cm, boot_sole_length_mm, din, "
    "created_at, updated_at"
)


def _row_to_user_response(col_names: list[str], row: tuple) -> UserResponse:
    d = dict(zip(col_names, row))
    return UserResponse(
        id=d["id"],
        name=d["name"],
        email=d["email"],
        sport=d["sport"],
        skillLevel=d["skill_level"],
        preferredEquipment=d["preferred_equipment"],
        preferredTerrain=d["preferred_terrain"],
        skierType=d.get("skier_type"),
        birthday=d.get("birthday"),
        weightKg=float(d["weight_kg"]) if d.get("weight_kg") is not None else None,
        heightCm=float(d["height_cm"]) if d.get("height_cm") is not None else None,
        bootSoleLengthMm=d.get("boot_sole_length_mm"),
        DIN=float(d["din"]),
        createdAt=d["created_at"],
        updatedAt=d["updated_at"],
    )


def list_users() -> UserListResponse:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {_SELECT_COLS} FROM users")
    rows = cursor.fetchall()
    col_names = [col.name for col in cursor.description]
    cursor.close()
    return UserListResponse(users=[_row_to_user_response(col_names, row) for row in rows])


def get_user(user_id: str) -> UserResponse | None:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {_SELECT_COLS} FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    col_names = [col.name for col in cursor.description]
    cursor.close()
    if row is None:
        return None
    return _row_to_user_response(col_names, row)


def upsert_user(user_id: str, payload: UserWrite, din: float) -> tuple[UserResponse, bool]:
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    is_new = cursor.fetchone() is None

    if is_new:
        cursor.execute(
            f"""INSERT INTO users (id, name, email, sport, skill_level, preferred_equipment,
                preferred_terrain, skier_type, birthday, weight_kg, height_cm,
                boot_sole_length_mm, din, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING {_SELECT_COLS}""",
            (
                user_id, payload.name, payload.email, payload.sport, payload.skillLevel,
                payload.preferredEquipment, payload.preferredTerrain, payload.skierType,
                payload.birthday, payload.weightKg, payload.heightCm,
                payload.bootSoleLengthMm, din,
            ),
        )
    else:
        cursor.execute(
            f"""UPDATE users
                SET name=%s, email=%s, sport=%s, skill_level=%s,
                    preferred_equipment=%s, preferred_terrain=%s, skier_type=%s,
                    birthday=%s, weight_kg=%s, height_cm=%s, boot_sole_length_mm=%s,
                    din=%s, updated_at=NOW()
                WHERE id=%s
                RETURNING {_SELECT_COLS}""",
            (
                payload.name, payload.email, payload.sport, payload.skillLevel,
                payload.preferredEquipment, payload.preferredTerrain, payload.skierType,
                payload.birthday, payload.weightKg, payload.heightCm,
                payload.bootSoleLengthMm, din, user_id,
            ),
        )

    row = cursor.fetchone()
    col_names = [col.name for col in cursor.description]
    conn.commit()
    cursor.close()
    return _row_to_user_response(col_names, row), is_new


def delete_user(user_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
    deleted = cursor.fetchone() is not None
    conn.commit()
    cursor.close()
    return deleted


def reset_user_store() -> None:
    """Truncate users table. Used by tests to reset state between test cases."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE users")
    conn.commit()
    cursor.close()


def _calculate_age(birthday: date) -> int:
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))


def serialize_validation_error(exc: ValidationError) -> list[dict[str, Any]]:
    return [
        {
            "type": error["type"],
            "loc": error["loc"],
            "msg": error["msg"],
            "input": error.get("input"),
        }
        for error in exc.errors()
    ]


def validate_user_write(payload: dict[str, Any]) -> tuple[UserWrite | None, list[dict[str, Any]] | None]:
    try:
        return UserWrite.model_validate(payload), None
    except ValidationError as exc:
        return None, serialize_validation_error(exc)


def assign_din(user: UserWrite) -> tuple[float | None, str | None]:
    if (
        user.skierType is None
        or user.birthday is None
        or user.weightKg is None
        or user.heightCm is None
        or user.bootSoleLengthMm is None
    ):
        return (
            None,
            (
                "DIN requires skierType, birthday, weightKg, heightCm, "
                "and bootSoleLengthMm."
            ),
        )

    try:
        return (
            calculate_din(
                weight=user.weightKg,
                boot_sole_length_mm=user.bootSoleLengthMm,
                age=_calculate_age(user.birthday),
                skier_type=user.skierType,
            ),
            None,
        )
    except ValueError as exc:
        return None, str(exc)
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/users.py
git commit -m "feat: replace in-memory user store with Cloud SQL pg8000 queries"
```

---

### Task 5: Update main.py with Lifespan

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Replace the contents of `backend/main.py`**

```python
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from backend.db.connection import close_connection, init_connection
from backend.routers.assessments import router as assessments_router
from backend.routers.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_connection()
    yield
    close_connection()


app = FastAPI(title="SkiWare", lifespan=lifespan)

app.include_router(assessments_router)
app.include_router(users_router)


if __name__ == "__main__":
    from uvicorn import run

    port = int(os.environ.get("PORT", 8080))
    run("backend.main:app", host="0.0.0.0", port=port)
```

- [ ] **Step 2: Commit**

```bash
git add backend/main.py
git commit -m "feat: add lifespan context manager to open/close DB connection on startup/shutdown"
```

---

### Task 6: Test Setup (conftest.py)

**Files:**
- Create: `tests/conftest.py`

The existing `tests/test_app.py` uses a `clear_user_store` fixture (already defined in that file) that calls `reset_user_store()`. After our refactor, `reset_user_store()` truncates the DB table. We just need to ensure the DB connection is initialized before any tests run.

- [ ] **Step 1: Create `tests/conftest.py`**

```python
import os
import pathlib

import pytest

from backend.db.connection import close_connection, get_db, init_connection


@pytest.fixture(scope="session", autouse=True)
def db_connection():
    """Initialize a real DB connection for the test session.

    Uses local Docker postgres by default. Override with env vars for Cloud SQL:
      CLOUD_SQL_INSTANCE, DB_NAME, DB_USER
    """
    os.environ.setdefault("DB_HOST", "localhost")
    os.environ.setdefault("DB_PORT", "5432")
    os.environ.setdefault("DB_NAME", "skiware")
    os.environ.setdefault("DB_USER", "skiware")
    os.environ.setdefault("DB_PASSWORD", "skiware")

    init_connection()

    # Apply migration so tables exist
    conn = get_db()
    cursor = conn.cursor()
    migration = pathlib.Path(__file__).parent.parent / "migrations" / "001_init.sql"
    sql = migration.read_text()
    for stmt in sql.split(";"):
        stmt = stmt.strip()
        if stmt:
            cursor.execute(stmt)
    conn.commit()
    cursor.close()

    yield

    close_connection()
```

- [ ] **Step 2: Commit**

```bash
git add tests/conftest.py
git commit -m "test: add session-scoped DB connection fixture for integration tests"
```

---

### Task 7: Local Dev — Docker Compose + .env.example

**Files:**
- Modify: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Replace `docker-compose.yml`**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15
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

  app:
    build: .
    command: ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - PORT=8080
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=skiware
      - DB_USER=skiware
      - DB_PASSWORD=skiware
    volumes:
      - ./backend:/app/backend

  frontend:
    build:
      context: ./frontend
    depends_on:
      - app
    environment:
      - VITE_API_PROXY_TARGET=http://app:8080
      - CHOKIDAR_USEPOLLING=true
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/frontend
      - frontend_node_modules:/frontend/node_modules

volumes:
  frontend_node_modules:
```

- [ ] **Step 2: Create `.env.example`**

```bash
# ── Local Docker dev ────────────────────────────────────────────────
# Used when running outside docker-compose (e.g. pytest, python -m backend.main)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skiware
DB_USER=skiware
DB_PASSWORD=skiware

# ── Cloud SQL (GCP) ─────────────────────────────────────────────────
# Set these instead of DB_HOST/DB_PASSWORD when connecting to Cloud SQL.
# DB_PASSWORD is omitted to trigger IAM auth.
# CLOUD_SQL_INSTANCE=skiware:us-central1:skiware-db
# DB_NAME=skiware
# DB_USER=maca6216@colorado.edu          # local dev with your GCP account
# DB_USER=skiware-app@skiware.iam.gserviceaccount.com  # Cloud Run

# ── data_agent ──────────────────────────────────────────────────────
# Required when running: python -m data_agent
# GEMINI_API_KEY=your-gemini-api-key-here
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add local postgres service to docker-compose and document env vars in .env.example"
```

---

### Task 8: Run Tests Against Local Docker Postgres

- [ ] **Step 1: Start the local postgres container**

```bash
docker compose up postgres -d
```

Expected: container starts, healthcheck passes within ~15 seconds.

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/Matthew/Desktop/CompSci/SkiWare && pip install -r requirements.txt -q
```

- [ ] **Step 3: Run the full test suite**

```bash
cd /Users/Matthew/Desktop/CompSci/SkiWare && pytest tests/ -v
```

Expected: all tests pass. The `db_connection` fixture in `conftest.py` will create the tables on first run via the migration SQL.

If any test fails, check:
- Is the `postgres` container running? `docker compose ps`
- Does the `skiware` database exist? `docker compose exec postgres psql -U skiware -c "\l"`
- Are the tables created? `docker compose exec postgres psql -U skiware -d skiware -c "\dt"`

---

---

> ⏸️ **PR PAUSE POINT** — Tasks 1–8 form a complete, working unit: local Docker dev, backend wired to DB, all tests passing. Create a PR here before continuing to Tasks 9–11 (CI/CD, data_agent, Vertex AI swap).

---

### Task 9: Update CI/CD Deploy Workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Replace the deploy step in `.github/workflows/deploy.yml`**

Find the `Deploy to Cloud Run` step and replace its `run` block:

```yaml
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image "$IMAGE" \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --memory 256Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 3 \
            --service-account skiware-app@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com \
            --add-cloudsql-instances ${{ secrets.GCP_PROJECT_ID }}:us-central1:skiware-db \
            --set-env-vars "CLOUD_SQL_INSTANCE=${{ secrets.GCP_PROJECT_ID }}:us-central1:skiware-db,DB_NAME=skiware,DB_USER=skiware-app@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com" \
            --quiet
```

Also update the `SERVICE_NAME` env var at the top of the file from `hello-world` to `skiware`:

```yaml
env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: skiware
  REPO_NAME: cloud-run-apps
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: configure Cloud Run deploy with Cloud SQL connection and app service account"
```

---

### Task 10: Swap data_agent Embedder to Vertex AI

**Files:**
- Modify: `data_agent/pipeline/embedder.py`
- Modify: `data_agent/requirements.txt`

- [ ] **Step 1: Update `data_agent/requirements.txt`**

Replace `google-generativeai==0.8.3` with `google-cloud-aiplatform>=1.38.0`:

```
google-cloud-aiplatform>=1.38.0
requests==2.32.3
beautifulsoup4==4.12.3
cloud-sql-python-connector[pg8000]==1.12.1
```

- [ ] **Step 2: Replace `data_agent/pipeline/embedder.py`**

```python
import logging
import os

import vertexai
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

logger = logging.getLogger(__name__)

BATCH_SIZE = 100
MODEL_NAME = "text-embedding-004"
EMBEDDING_DIM = 768


def embed_batch(texts: list[str]) -> list[list[float]]:
    vertexai.init(
        project=os.environ["GCP_PROJECT"],
        location=os.environ.get("GCP_REGION", "us-central1"),
    )
    model = TextEmbeddingModel.from_pretrained(MODEL_NAME)
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        logger.info(f"Embedding batch {i // BATCH_SIZE + 1} ({len(batch)} texts)")
        inputs = [TextEmbeddingInput(text=t, task_type="RETRIEVAL_DOCUMENT") for t in batch]
        result = model.get_embeddings(inputs)
        all_embeddings.extend([e.values for e in result])

    return all_embeddings
```

- [ ] **Step 3: Commit**

```bash
git add data_agent/pipeline/embedder.py data_agent/requirements.txt
git commit -m "feat: swap data_agent embedder from Gemini API key to Vertex AI IAM auth"
```

---

### Task 12: Run the data_agent Pipeline Against Cloud SQL

**Files:** none (env vars + run command)

- [ ] **Step 1: Ensure Application Default Credentials are set**

```bash
gcloud auth application-default login
```

- [ ] **Step 2: Export env vars and run the pipeline**

```bash
cd /Users/Matthew/Desktop/CompSci/SkiWare

export CLOUD_SQL_INSTANCE="skiware:us-central1:skiware-db"
export DB_NAME="skiware"
export DB_USER="maca6216@colorado.edu"
export GCP_PROJECT="skiware"
export GCP_REGION="us-central1"

pip install -r data_agent/requirements.txt -q
python -m data_agent
```

Expected output (abbreviated):
```
INFO data_agent.main: Running source: StaticDocsSource
INFO data_agent.main: Processed <url> — N chunks
INFO data_agent.main: Run complete. Total chunks upserted: N
```

- [ ] **Step 3: Commit the data_agent module (currently untracked)**

```bash
git add data_agent/
git commit -m "feat: add data_agent RAG ingestion pipeline"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run the full test suite one more time**

```bash
pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 2: Smoke test the backend locally**

```bash
# In one terminal:
docker compose up postgres -d

# In another:
DB_HOST=localhost DB_NAME=skiware DB_USER=skiware DB_PASSWORD=skiware \
  uvicorn backend.main:app --reload --port 8080
```

Then:
```bash
curl -s -X PUT http://localhost:8080/api/users/test-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","sport":"Skier","skillLevel":"intermediate","preferredEquipment":"skis","preferredTerrain":"hybrid","skierType":2,"birthday":"1990-01-01","weightKg":70,"heightCm":175,"bootSoleLengthMm":300}' | python -m json.tool
```

Expected: JSON response with `id`, `DIN`, `createdAt`, `updatedAt` fields.

```bash
curl -s http://localhost:8080/api/users | python -m json.tool
```

Expected: `{"users": [{...}]}` with the user you just created.
