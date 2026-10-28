FROM node:24-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS dependencies
RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY scripts/platform/integrity-cache-release.c /tmp/integrity-cache-release.c
RUN mkdir -p /app/bin \
  && cc -O2 -std=c11 -Wall -Wextra -Werror \
    /tmp/integrity-cache-release.c -o /app/bin/traderlink-integrity-cache-release

FROM base AS builder
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN node scripts/platform/build-erasure-worker.cjs --out-dir /app/erasure-worker
RUN node scripts/platform/build-news-maintenance-command-20261028.cjs

FROM base AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=dependencies --chown=nextjs:nodejs /app/bin/traderlink-integrity-cache-release ./bin/traderlink-integrity-cache-release
COPY --from=builder --chown=nextjs:nodejs /app/erasure-worker ./workers
COPY --from=builder --chown=nextjs:nodejs /app/news-maintenance/news-general-0185-maintenance.cjs ./workers/news-general-0185-maintenance.cjs

# Normal application and workers start only after exact schema149 is proven.
# Guarded migration and prepared148/149 recovery images are separate operations.
RUN mv /app/server.js /app/application-server.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/general-news-public-service-entrypoint-20261028.cjs ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/general-news-release-entrypoint-20261028.cjs ./scripts/platform/general-news-release-entrypoint-20261028.cjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/general-news-release-manifest-20261028.json ./scripts/platform/general-news-release-manifest-20261028.json

COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/general-news-image-source-20261028.json ./scripts/platform/general-news-image-source-20261028.json

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
