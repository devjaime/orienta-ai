# ===================================
# Vocari Backend - Dockerfile
# ===================================
# Multi-stage build para optimizar imagen

# --- Stage 1: Build dependencies ---
FROM python:3.12-slim AS builder

WORKDIR /build

# Instalar dependencias del sistema para compilacion
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copiar solo archivos de dependencias para cache
COPY pyproject.toml ./

# Instalar dependencias en un venv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# --- Stage 2: Runtime ---
FROM python:3.12-slim AS runtime

WORKDIR /app

# Dependencias de runtime minimas
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r vocari && useradd -r -g vocari vocari

# Copiar venv desde builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copiar codigo fuente
COPY . .

# Cambiar a usuario no-root
USER vocari

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
