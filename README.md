# SkiWare

An intelligent web application that helps skiers identify, assess, and repair ski damage. SkiWare combines a RAG system with ski-specific knowledge to give users informed, personalized repair guidance — complete with severity assessments, estimated shop costs, step-by-step DIY instructions, YouTube repair guides, and links to purchase materials.

---

## Problem Statement

Ski repairs are expensive and intimidating for casual skiers. Most people can't distinguish between minor cosmetic damage and serious structural issues, leading to either unnecessary shop visits or dangerous equipment failures. Simple repairs that could be done at home often result in $50+ shop charges.

---

## Solution

A free web application where users input their ski info and describe their issue. SkiWare queries a knowledge base of ski-specific data to return:

- **Safety flag** — is it safe to ski on right now?
- **Severity indicator** — 1–5 scale with a clear DIY vs. take-to-a-shop verdict
- **Estimated shop cost** — so users know what they'd save by doing it themselves
- **Time and skill estimate** — how long it takes and what skill level is required
- **Step-by-step DIY repair instructions**
- **Parts checklist** — specific products with purchase links (Amazon, REI, evo)
- **Relevant YouTube repair guides**

---

## How It Works

1. **User fills out a modal** with their ski details:
   - Brand, model, year
   - Length
   - New/used condition
   - Last wax / edge sharpening (rough date)
   - Description of the issue

2. **RAG query** — the input searches a vector database of ski-specific knowledge (common issues by model, manufacturer specs, repair guides, parts sources)


3. **LLM response** — the Gemini API generates structured repair guidance grounded in the retrieved context with YouTube Links and purchase recommendations.

---

## Target Users

- **Primary:** Recreational skiers who want to save money and learn basic maintenance
- **Secondary:** Ski shops looking for quick damage assessment and quote generation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Frontend | Flask +  React |
| LLM | Gemini API (Google) |
| Vector Database | pgvector on GCP Cloud SQL (PostgreSQL) |
| Data Collection | GCP Cloud Run Jobs (scheduled Python agent) |
| Hosting | GCP Cloud Run |
| Container Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions |
| Layer | Current | Target |
|---|---|---|
| Backend | Python / Flask | Python / FastAPI |
| Frontend | Flask placeholder | React |
| LLM | — | Gemini API (Google) |
| Vector Database | — | pgvector on GCP Cloud SQL (PostgreSQL) |
| Data Collection | — | GCP Cloud Run Jobs (scheduled Python agent) |
| Hosting | GCP Cloud Run | GCP Cloud Run |
| Container Registry | GCP Artifact Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions | GitHub Actions |

> **Note:** The backend is currently a Flask placeholder used to validate the CI/CD pipeline. The migration to FastAPI and React is the first major development milestone. See [CONTRIBUTING.md](CONTRIBUTING.md) for migration guidance.

---

## Architecture

```
User Browser
     │
     ▼
React Frontend          ← target (currently Flask placeholder)
     │ JSON over HTTP
     ▼
FastAPI Backend         ← target (currently Flask placeholder)
     │
     ├── POST /assess
     │     ├── Embed user input
     │     ├── Query pgvector (retrieve relevant ski/repair context)
     │     └── Gemini API (LLM generates response with context)
     │     └── Gemini API (LLM generates structured response with context)
     │
     └── GET / (health, static)

Cloud Run Job (scheduled)
     │
     └── Data collection agent
           ├── Scrapes ski specs, common issues, repair guides, parts sources
           ├── Embeds and upserts into pgvector
           └── Creates GitHub issues for gaps / new data needs

Cloud SQL (PostgreSQL + pgvector)
     └── Stores ski knowledge base as vector embeddings
```

---

## Features

### MVP
| Feature | Description |
|---|---|
| Ski info modal | Brand, model, year, length, condition, last service, issue description |
| Safety flag | Prominent yes/no — is it safe to ski on? |
| Severity indicator | 1–5 scale (color-coded) with DIY vs. shop verdict |
| Estimated shop cost | Dollar range of what a shop would charge for the same repair |
| Time + skill estimate | How long the repair takes and beginner / intermediate / advanced rating |
| Repair instructions | Step-by-step DIY guide |
| Parts checklist | Specific products with links to purchase |
| YouTube guides | Relevant repair video links |

### v1
| Feature | Description |
|---|---|
| Automated knowledge base | Cloud Run Job scrapes and embeds ski data on a schedule |
| Ski value estimator | "Your ski is worth ~$X used — a $Y repair may not be worth it" |
| Maintenance calendar | Wax/sharpen reminders based on ski type and usage |
| Shop locator | Google Maps API — nearby shops if user chooses not to DIY |
| Condition report | Shareable PDF summary (useful for buying/selling used skis) |

### v2
| Feature | Description |
|---|---|
| Photo upload | Vision model classifies damage type from a photo |
| React frontend | Richer UI, better mobile experience |
| Community repair logs | "47 people fixed this on a Rossignol Experience 88 — here's what worked" |
| Ski shop dashboard | Shop-facing version for quote generation and work orders |

---

## Key Technical Challenges

- **RAG quality** — response quality depends on knowledge base breadth. The data collection agent needs to cover a wide range of ski models and damage types.
- **Retrieval relevance** — embedding ski model + issue description well enough to retrieve the right context chunks
- **Structured output** — getting the LLM to return consistent severity scores, cost estimates, and skill levels across different inputs
- **Data sourcing** — finding reliable sources for ski specs, common issues, and repair guides to feed the agent

---

## Roadmap

### MVP
- [ ] Migrate backend from Flask → FastAPI
- [ ] Build React frontend with ski info input modal
- [ ] Gemini API integration with structured response (safety flag, severity, cost estimate, time/skill, instructions, parts, YouTube links)
- [ ] Basic RAG pipeline with pgvector
- [ ] Initial knowledge base seeded manually

### v1
- [ ] Data collection Cloud Run Job
- [ ] Ski value estimator
- [ ] Maintenance calendar
- [ ] Shop locator (Google Maps API)
- [ ] Condition report PDF export
- [ ] GitHub issue creation agent for team task tracking

### v2
- [ ] Vision model for photo-based damage classification
- [ ] React frontend
- [ ] Community repair logs
- [ ] Ski shop dashboard

---

## Success Metrics

- Users get accurate repair guidance for common damage types (edge damage, base gouges, delamination)
- Severity and cost estimates align with real shop quotes
- Response includes at least one relevant YouTube guide and one purchase link
- Users report saving money vs. taking skis to a shop

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branching workflow, and PR guidelines.

this is a read me test change

---

## Front-End Figma Mockup

https://www.figma.com/make/KqC5Oz8NcWsw9GHjK1UY6Z/-?t=HvXVJCTIa0UEwSLV-1&preview-route=%2Fassessment
