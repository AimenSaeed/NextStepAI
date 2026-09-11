# ==============================================================================
# Stage 1: Build React Frontend
# ==============================================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --ignore-scripts

COPY frontend/ ./
# Build production bundle into /app/frontend/dist
RUN npm run build

# ==============================================================================
# Stage 2: Combined Python + Nginx Container
# ==============================================================================
FROM python:3.12-slim AS runtime

# Install system dependencies, Nginx, and Supervisord
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies for both backend and ai-rag
COPY backend/requirements.txt ./backend/requirements.txt
COPY ai-rag/requirements.txt  ./ai-rag/requirements.txt

RUN pip install --no-cache-dir \
    -r backend/requirements.txt \
    -r ai-rag/requirements.txt \
    "uvicorn[standard]" \
    python-dotenv

# Copy source code
COPY backend/        ./backend/
COPY ai-rag/         ./ai-rag/
COPY database/       ./database/
COPY main.py         ./main.py

# Copy built React frontend to Nginx html directory and frontend/dist
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Nginx & Supervisord configurations
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Seed SQLite database from CSV if missing
RUN python database/import_opportunities.py

# Create directory for persistent ChromaDB & registry
RUN mkdir -p /app/data

EXPOSE 80 8000

# Health check via Nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
