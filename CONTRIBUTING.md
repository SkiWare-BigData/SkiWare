# SkiWare — Contributor Guide

SkiWare is an AI-powered ski damage assessment tool. Users input their ski details and describe an issue — SkiWare returns a safety flag, severity rating, estimated shop cost, DIY repair instructions, a parts checklist, and relevant YouTube guides. See [README.md](README.md) for full project context.

---

## Project Structure

```
SkiWare/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── models.py            # Shared Pydantic request/response models
│   ├── routers/             # API route handlers
│   └── services/            # Business logic behind route handlers
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD — auto-deploys to GCP Cloud Run on push to main
├── Dockerfile               # Container definition
├── docker-compose.yml       # Local development setup
├── requirements.txt         # Python dependencies
└── setup-gcp.sh             # One-time GCP bootstrap script (already run, don't re-run)
```

Current structure:
```
SkiWare/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── models.py            # Pydantic models for request/response validation
│   ├── routers/             # API route handlers
│   └── services/            # Business logic behind the API
├── frontend/                # React app (Create React App or Vite)
│   ├── src/
│   └── package.json
├── .github/workflows/
│   └── deploy.yml
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- Docker (for running locally in a container)

### Prerequisites
- Python 3.12+
- Docker Desktop (required — the database runs in a container)

### Local Setup

```bash
git clone https://github.com/Casazza24/SkiWare.git
cd SkiWare

# Copy env template (defaults work out of the box for local dev)
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the local postgres database
docker compose up postgres -d

# Run the backend (connects to local Docker postgres automatically)
python3 -m backend.main
```

App runs at `http://localhost:8080`.

### Local Setup with Docker (matches production exactly)

```bash
docker compose up --build
```

Frontend runs at `http://localhost:5173`.
Backend API runs at `http://localhost:8080`.
The `backend/` and `frontend/` directories are volume-mounted so changes reflect immediately in local development.

> **No GCP access needed for local dev.** The postgres service (`pgvector/pgvector:pg15`) runs entirely in Docker. Cloud SQL is only used in production.

### Running Tests

```bash
docker compose up postgres -d   # must be running first
pytest tests/ -v
```

The test suite connects to the local Docker postgres, applies the migration automatically on first run, and truncates the `users` table between each test. No manual setup needed.

---

## Connecting to Cloud SQL (GCP)

> **Only needed if you are running the `data_agent` ingestion pipeline against production.** For normal backend development and testing, the local Docker postgres is sufficient.

### One-time setup

**1. Authenticate with GCP:**
```bash
gcloud auth application-default login
gcloud config set project skiware
```

**2. Get your Google account added as a Cloud SQL IAM user** — ask the project owner to run:
```bash
gcloud sql users create YOUR_EMAIL@colorado.edu \
  --instance=skiware-db \
  --type=CLOUD_IAM_USER
```

### Running data_agent against Cloud SQL

```bash
export CLOUD_SQL_INSTANCE="skiware:us-central1:skiware-db"
export DB_NAME="skiware"
export DB_USER="YOUR_EMAIL@colorado.edu"
export GCP_PROJECT="skiware"
export GCP_REGION="us-central1"

pip install -r data_agent/requirements.txt
python -m data_agent
```

No proxy needed — the Cloud SQL Python Connector authenticates via your Application Default Credentials automatically.

---

## Making Changes

### Workflow
1. Pull the latest `main`
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes under `backend/` or `frontend/`
4. Test locally
5. Open a PR against `main`

### Adding Python Dependencies

Add the package + pinned version to `requirements.txt`, then reinstall:

```bash
pip install <package>
pip freeze | grep <package>   # get the pinned version
# add it to requirements.txt manually
pip install -r requirements.txt
```

### Deployment

GitHub Actions now does two things:
1. Runs CI on every PR to `main`
2. Runs the same CI checks on `main` pushes, then deploys only if they pass

CI currently validates:
1. Python dependencies install cleanly
2. The FastAPI placeholder passes smoke tests
3. The Docker image builds successfully

Deployment on `main` then:
1. Builds a Docker image
2. Pushes it to GCP Artifact Registry
3. Deploys to GCP Cloud Run

**Do not merge to `main` unless the app runs locally.** There is no staging environment — `main` is production.

---

## Tech Stack

| Layer | Current | Target |
|---|---|---|
| Backend | Python / FastAPI | Python / FastAPI |
| Frontend | React / Vite | React |
| Server | Uvicorn | Uvicorn (FastAPI's async server) |
| Container | Docker | Docker |
| LLM | — | Gemini API (Google) |
| Vector Database | — | pgvector on GCP Cloud SQL (PostgreSQL) |
| Data Collection | — | GCP Cloud Run Jobs (scheduled Python agent) |
| Hosting | GCP Cloud Run | GCP Cloud Run |
| Container Registry | GCP Artifact Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions | GitHub Actions |

### Current Backend

The initial Flask-to-FastAPI migration is complete. The current service provides:

1. `GET /` returning the placeholder HTML page
2. `GET /health` returning `{"status": "ok"}`
3. `POST /api/assess` returning maintenance recommendations
4. Local and container startup through `uvicorn`

Next backend steps:

1. Replace placeholder assessment logic with RAG-backed recommendations
2. Add backend modules for database and Gemini integrations
3. Expand router coverage as the API surface grows

---

## Environment Variables

See `.env.example` for the full reference. Key variables:

| Variable | Local dev | Cloud Run (production) |
|---|---|---|
| `DB_HOST` | `localhost` (or `postgres` in docker-compose) | not set |
| `DB_NAME` | `skiware` | `skiware` |
| `DB_USER` | `skiware` | `skiware-app@skiware.iam.gserviceaccount.com` |
| `DB_PASSWORD` | `skiware` | not set (triggers IAM auth) |
| `CLOUD_SQL_INSTANCE` | not set | `skiware:us-central1:skiware-db` |
| `PORT` | `8080` | `8080` |
| `GCP_PROJECT` | `skiware` (data_agent only) | `skiware` |

Any secrets should be added as GitHub Actions secrets and passed to Cloud Run via `--set-env-vars` in the deploy step — never committed to the repo.

---

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Test locally before opening a PR
- PRs require at least one approval before merging to `main`
- Merging to `main` = deploying to production
