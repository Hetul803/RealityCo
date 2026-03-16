# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Python backend
FROM python:3.11-slim AS backend

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Production image
FROM python:3.11-slim AS production

# Install serve for Next.js static files
RUN npm install -g serve

WORKDIR /app

# Copy backend
COPY --from=backend /app ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Environment variables
ENV PORT=8080
ENV PYTHONPATH=/app
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start both backend and frontend
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 & cd frontend && npx serve -s .next -l 3000"]
