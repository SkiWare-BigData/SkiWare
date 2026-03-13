# SkiWare — Contributor Guide

SkiWare is an AI-powered ski damage assessment tool. Users input their ski details and describe an issue — SkiWare returns a safety flag, severity rating, estimated shop cost, DIY repair instructions, a parts checklist, and relevant YouTube guides. See [README.md](README.md) for full project context.

---

## Project Structure

```
SkiWare/
├── app/
│   └── main.py              # Current FastAPI placeholder backend
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD — auto-deploys to GCP Cloud Run on push to main
├── Dockerfile               # Container definition
├── docker-compose.yml       # Local development setup
├── requirements.txt         # Python dependencies
└── setup-gcp.sh             # One-time GCP bootstrap script (already run, don't re-run)
```

**Target structure** once the backend and frontend are expanded:
```
SkiWare/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── routes/              # API route handlers
│   ├── rag/                 # Embedding, retrieval, pgvector logic
│   └── models.py            # Pydantic models for request/response validation
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

### Local Setup

```bash
git clone https://github.com/Casazza24/SkiWare.git
cd SkiWare

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python3 app/main.py
```

App runs at `http://localhost:8080`.

### Local Setup with Docker (matches production exactly)

```bash
docker compose up
```

App runs at `http://localhost:8080`. The `app/` directory is volume-mounted so changes to `app/main.py` reflect immediately without rebuilding.

---

## Making Changes

### Workflow
1. Pull the latest `main`
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes in `app/main.py` (or add new files under `app/`)
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
| Frontend | Placeholder HTML page | React |
| Server | Uvicorn | Uvicorn (FastAPI's async server) |
| Container | Docker | Docker |
| LLM | — | Gemini API (Google) |
| Vector Database | — | pgvector on GCP Cloud SQL (PostgreSQL) |
| Data Collection | — | GCP Cloud Run Jobs (scheduled Python agent) |
| Hosting | GCP Cloud Run | GCP Cloud Run |
| Container Registry | GCP Artifact Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions | GitHub Actions |

### Current Backend

The initial Flask-to-FastAPI migration is complete. The current placeholder service provides:

1. `GET /` returning the placeholder HTML page
2. `GET /health` returning `{"status": "ok"}`
3. Local and container startup through `uvicorn`

Next backend steps:

1. Add request/response models with Pydantic
2. Implement `POST /assess`
3. Split routes, models, and RAG logic into separate modules as the app grows

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the app listens on | `8080` |
| `GEMINI_API_KEY` | Gemini API key for LLM calls | required in production |
| `DATABASE_URL` | Cloud SQL connection string for pgvector | required in production |

Any secrets should be added as GitHub Actions secrets and passed to Cloud Run via `--set-env-vars` in the deploy step — never committed to the repo.

---

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Test locally before opening a PR
- PRs require at least one approval before merging to `main`
- Merging to `main` = deploying to production