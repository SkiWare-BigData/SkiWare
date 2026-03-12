# SkiWare — Contributor Guide

An AI-powered ski damage assessment tool. Upload a photo of your skis, get a damage classification, severity assessment, and step-by-step repair instructions.

---

## Project Structure

```
SkiWare/
├── app/
│   └── main.py              # Flask application (all backend logic lives here)
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD — auto-deploys to GCP Cloud Run on push to main
├── Dockerfile               # Container definition
├── docker-compose.yml       # Local development setup
├── requirements.txt         # Python dependencies
└── setup-gcp.sh             # One-time GCP bootstrap script (already run, don't re-run)
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

python app/main.py
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

Deployment is fully automatic. Every push to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml` which:
1. Builds a Docker image
2. Pushes it to GCP Artifact Registry
3. Deploys to GCP Cloud Run

**Do not merge to `main` unless the app runs locally.** There is no staging environment — `main` is production.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Server | Gunicorn |
| Container | Docker |
| Hosting | GCP Cloud Run (serverless) |
| Container Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the app listens on | `8080` |

Any secrets (API keys, etc.) should be added as GitHub Actions secrets and as Cloud Run environment variables — never committed to the repo.

---

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Test locally before opening a PR
- PRs require at least one approval before merging to `main`
- Merging to `main` = deploying to production