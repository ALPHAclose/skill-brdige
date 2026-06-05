# Server1 Dockerfile - Express, TypeScript, Prisma, Redis

FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache wget openssl

COPY package*.json ./

FROM base AS development

ENV NODE_ENV=development

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "server1/package.json not found yet; skipping npm install"; \
      mkdir -p node_modules dist; \
    fi

COPY prisma ./prisma

RUN if [ -f prisma/schema.prisma ]; then \
      npx --no-install prisma generate; \
    else \
      echo "server1 Prisma schema not found yet; skipping prisma generate"; \
    fi

COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev"]

FROM base AS builder

ENV NODE_ENV=production

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    else \
      echo "server1/package.json not found yet; skipping production install"; \
      mkdir -p node_modules dist; \
    fi

COPY prisma ./prisma

RUN if [ -f prisma/schema.prisma ]; then \
      npx --no-install prisma generate; \
    else \
      echo "server1 Prisma schema not found yet; skipping prisma generate"; \
    fi

COPY . .

RUN if [ -f package.json ]; then \
      npm run build && npm prune --omit=dev; \
    else \
      echo "server1 application has not been generated yet" > dist/.placeholder; \
    fi

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5001

CMD ["node", "dist/index.js"]
