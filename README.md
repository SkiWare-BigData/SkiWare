# SkiWare

An intelligent web application that helps skiers identify, assess, and repair ski damage. SkiWare combines a RAG system with ski-specific knowledge to give users informed, personalized repair guidance — complete with step-by-step instructions, YouTube repair guides, and links to purchase materials.

---

## Problem Statement

Ski repairs are expensive and intimidating for casual skiers. Most people can't distinguish between minor cosmetic damage and serious structural issues, leading to either unnecessary shop visits or dangerous equipment failures. Simple repairs that could be done at home often result in $50+ shop charges.

---

## Solution

A free web application where users input their ski info and describe their issue. SkiWare queries a knowledge base of ski-specific data to return:

- Damage classification and severity assessment
- Safety implications (is it safe to ski on?)
- Step-by-step DIY repair instructions
- Relevant YouTube repair guides
- Links to purchase required materials and tools

---

## How It Works

1. **User fills out a modal** with their ski details:
   - Brand, model, year
   - Length
   - New/used condition
   - Last wax / edge sharpening (rough date)
   - Description of the issue

2. **RAG query** — the input is used to search a vector database of ski-specific knowledge (common issues by model, manufacturer specs, repair guides, parts sources)

3. **LLM response** — Claude generates repair guidance grounded in the retrieved context, with YouTube links and purchase recommendations

---

## Target Users

- **Primary:** Recreational skiers who want to save money and learn basic maintenance
- **Secondary:** Ski shops looking for quick damage assessment and quote generation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Frontend | Flask + Jinja2 templates (MVP), React (v2) |
| LLM | Gemini API (Google) |
| Vector Database | pgvector on GCP Cloud SQL (PostgreSQL) |
| Data Collection | GCP Cloud Run Jobs (scheduled Python agent) |
| Hosting | GCP Cloud Run |
| Container Registry | GCP Artifact Registry |
| CI/CD | GitHub Actions |

---

## Architecture

```
User Browser
     │
     ▼
Flask App (Cloud Run)
     │
     ├── POST /assess
     │     ├── Embed user input
     │     ├── Query pgvector (retrieve relevant ski/repair context)
     │     └── Claude API (LLM generates response with context)
     │
     └── Static pages / modal form

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

## Key Technical Challenges

- **RAG quality** — the usefulness of responses depends heavily on the breadth and accuracy of the knowledge base. The data collection agent needs to cover a wide range of ski models and damage types.
- **Retrieval relevance** — embedding ski model + issue description well enough to retrieve the right context chunks
- **Data sourcing** — finding reliable, structured sources for ski specs, common issues, and repair guides to feed the agent

---

## Roadmap

### MVP
- [ ] Ski info input modal (brand, model, year, length, condition, last service, issue description)
- [ ] Flask backend with Gemini API integration
- [ ] Basic RAG pipeline with pgvector
- [ ] Initial knowledge base seeded manually

### v1
- [ ] Data collection Cloud Run Job (automated knowledge base population)
- [ ] YouTube repair guide links in responses
- [ ] Parts/materials purchase links
- [ ] GitHub issue creation agent for team task tracking

### v2
- [ ] Vision model for photo-based damage classification
- [ ] React frontend
- [ ] Ski shop dashboard for quote generation

---

## Success Metrics

- Users get accurate repair guidance for common damage types (edge damage, base gouges, delamination)
- Response includes at least one relevant YouTube guide and one purchase link
- Users report saving money vs. taking skis to a shop

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branching workflow, and PR guidelines.