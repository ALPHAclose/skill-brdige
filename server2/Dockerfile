# Server2 Dockerfile - FastAPI, SQLAlchemy, GraphQL

FROM python:3.11-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY . .

FROM base AS development

ENV ENVIRONMENT=development

RUN if [ -f requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt; \
    else \
      echo "server2/requirements.txt not found yet; skipping pip install"; \
    fi

EXPOSE 5002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5002", "--reload"]

FROM base AS production

ENV ENVIRONMENT=production

RUN if [ -f requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt; \
    else \
      echo "server2/requirements.txt not found yet; skipping pip install"; \
    fi

EXPOSE 5002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5002", "--workers", "2"]
