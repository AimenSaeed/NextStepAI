# NextStep AI - Unified Production Deployment Guide

## Architecture

`
USER → ONE URL (e.g. https://nextstepai.onrender.com)
         │
         └── FastAPI  (main.py at repo root)
              ├── GET  /              → React SPA (frontend/dist/)
              ├── GET  /health        → Health check
              ├── POST /api/match     → Scholarship matching engine
              ├── GET  /api/opportunities/count
              ├── POST /api/analyze   → AI-RAG evidence layer
              └── GET  /api/docs      → Auto-generated API docs
`

Everything runs in **one Python process** — no separate backend or RAG servers needed in production.

---

## Quickstart (local unified mode)

`ash
# 1. Clone and enter repo
git clone https://github.com/AimenSaeed/NextStepAI
cd NextStepAI

# 2. Install Python deps (one venv for everything)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r backend/requirements.txt -r ai-rag/requirements.txt
pip install "fastapi[standard]" "uvicorn[standard]" python-dotenv

# 3. Seed the database
python database/import_opportunities.py

# 4. Build the React frontend
cd frontend && npm install && npm run build && cd ..

# 5. Copy env and add your Gemini key (optional)
copy .env.example .env

# 6. Start the unified server
uvicorn main:app --host 0.0.0.0 --port 8000

# Open http://localhost:8000
`

---

## Deploy to Render (free tier)

### One-click: Web Service from GitHub

1. Go to https://dashboard.render.com → **New → Web Service**
2. Connect your GitHub repo AimenSaeed/NextStepAI
3. Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | nextstep-ai |
| **Environment** | Docker |
| **Branch** | main |
| **Dockerfile path** | Dockerfile |
| **Port** | 8000 |
| **Health check path** | /health |

4. Under **Environment Variables** add:
   - GEMINI_API_KEY = your key from https://aistudio.google.com/app/apikey
   - CORS_ORIGINS = https://nextstep-ai.onrender.com (your final URL)
   - ENVIRONMENT = production

5. Click **Deploy** — Render builds the Docker image (≈ 5 min first time).

> **Free tier note**: The app sleeps after 15 minutes of inactivity. First request after sleep takes ~30 s. Upgrade to Starter (\/mo) to avoid this.

---

## Deploy to Fly.io (always-on free tier)

`ash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (reads Dockerfile automatically)
fly launch --name nextstep-ai --region sin --no-deploy

# Set secrets
fly secrets set GEMINI_API_KEY=your_key ENVIRONMENT=production

# Deploy
fly deploy
`

Fly.io gives 3 shared-CPU VMs free. Your app will not sleep.

---

## Deploy to Railway

1. Connect GitHub repo at https://railway.app
2. Railway auto-detects the Dockerfile
3. Set env vars: GEMINI_API_KEY, CORS_ORIGINS, ENVIRONMENT=production
4. Done — Railway assigns a free URL

---

## Docker (self-hosted / VPS)

`ash
# Build
docker build -t nextstep-ai .

# Run
docker run -d \
  -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e ENVIRONMENT=production \
  -v nextstep_data:/app/data \
  nextstep-ai

# Open http://localhost:8000
`

Use -v nextstep_data:/app/data to persist ChromaDB data across restarts.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| GEMINI_API_KEY | *(empty)* | Google Gemini API key. Empty = hash-embedding fallback |
| LLM_MODEL | gemini-2.0-flash | Gemini model name |
| CHROMA_PATH | ./data/chroma | ChromaDB persistence directory |
| SOURCE_REGISTRY_PATH | ./data/source_registry.sqlite3 | RAG source cache |
| MEMBER_A_BASE_URL | http://127.0.0.1:8000 | Internal: RAG calls matching engine |
| CORS_ORIGINS | * | Comma-separated allowed origins |
| ENVIRONMENT | development | production or development |
| GEMINI_TIMEOUT_SECONDS | 30 | RAG request timeout |

---

## Local Development (separate servers, original workflow)

If teammates prefer running backend and RAG separately:

`ash
# Terminal 1 — Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — RAG
cd ai-rag && uvicorn app.main:app --reload --port 8001

# Terminal 3 — Frontend
cd frontend && npm run dev
`

Create rontend/.env.local:
`
VITE_API_BASE=http://127.0.0.1:8000
VITE_AI_RAG_BASE=http://127.0.0.1:8001
`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | / | React SPA |
| GET  | /health | Health check (JSON) |
| POST | /api/match | Match student to scholarships |
| GET  | /api/opportunities/count | Count loaded scholarships |
| POST | /api/analyze | AI-RAG evidence analysis |
| GET  | /api/docs | Swagger UI |
| GET  | /api/redoc | ReDoc UI |

---

## Troubleshooting

**Q: App loads but /api/match returns 404**
Make sure you are running main.py at the repo root (not ackend/app/main.py).

**Q: rontend/dist/ not found warning in logs**
Run 
pm run build in the rontend/ directory before starting the server.

**Q: RAG returns member_a_unavailable**
The RAG service calls the matching engine at MEMBER_A_BASE_URL. In unified mode this should be http://127.0.0.1:8000 (the same process). If running in Docker, this is already correct.

**Q: No AI enrichment (only local matching)**
Set GEMINI_API_KEY in your .env. Without it, RAG uses deterministic hash embeddings (no Gemini calls).

**Q: Database is empty after deploy**
The Dockerfile runs database/import_opportunities.py at build time. If you skip Docker, run it manually once.
