# Gateway Dockerfile - Express and TypeScript API Gateway

FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./

FROM base AS development

ENV NODE_ENV=development

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "gateway/package.json not found yet; skipping npm install"; \
      mkdir -p node_modules dist; \
    fi

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

FROM base AS builder

ENV NODE_ENV=production

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "gateway/package.json not found yet; skipping production install"; \
      mkdir -p node_modules dist; \
    fi

COPY . .

RUN if [ -f package.json ]; then \
      npm run build && npm prune --omit=dev; \
    else \
      echo "gateway application has not been generated yet" > dist/.placeholder; \
    fi

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
