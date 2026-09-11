# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Python runtime ────────────────────────────────────
FROM python:3.12-slim AS runtime

# System deps for chromadb, PDF parsing, and native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps from both backend and ai-rag
COPY backend/requirements.txt  ./backend/requirements.txt
COPY ai-rag/requirements.txt   ./ai-rag/requirements.txt

RUN pip install --no-cache-dir \
    -r backend/requirements.txt \
    -r ai-rag/requirements.txt \
    "fastapi[standard]" \
    "uvicorn[standard]" \
    python-dotenv

# Copy project source
COPY backend/        ./backend/
COPY ai-rag/         ./ai-rag/
COPY database/       ./database/
COPY main.py         ./main.py

# Copy built React app from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Seed the SQLite database from the bundled CSV at build time
RUN python database/import_opportunities.py

# Runtime data directory for ChromaDB and source registry
RUN mkdir -p /app/data

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
