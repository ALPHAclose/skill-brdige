# Frontend Dockerfile - Next.js

FROM node:20-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget

COPY . .

FROM base AS development

ENV NODE_ENV=development

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "frontend/package.json not found yet; skipping npm install"; \
      mkdir -p node_modules .next; \
    fi

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM base AS builder

ENV NODE_ENV=production

RUN mkdir -p node_modules .next && \
    if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "frontend/package.json not found yet; skipping production install"; \
    fi

RUN if [ -f package.json ]; then \
      npm run build && npm prune --omit=dev; \
    else \
      echo "frontend application has not been generated yet" > .next/.placeholder; \
    fi

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache wget

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]
