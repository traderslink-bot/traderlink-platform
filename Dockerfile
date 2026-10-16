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
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

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

COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/staging-release-entrypoint-20261016.cjs ./scripts/platform/staging-release-entrypoint-20261016.cjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/staging-release-manifest-20261016.json ./scripts/platform/staging-release-manifest-20261016.json
COPY --from=dependencies /app/node_modules/tsx ./node_modules/tsx
COPY --from=dependencies /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=dependencies /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=dependencies /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=dependencies /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
ENV TRADERLINK_STAGING_IMAGE_ROLE=recovery

USER nextjs
EXPOSE 3000

CMD ["node", "scripts/platform/staging-release-entrypoint-20261016.cjs"]
