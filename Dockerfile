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
RUN node scripts/platform/analyzer-0186-bundle.cjs
RUN node scripts/platform/build-erasure-worker.cjs --out-dir /app/erasure-worker
RUN node scripts/platform/build-journal-demo-worker.cjs /app/demo-worker/journal-demo-setup.cjs
RUN node scripts/platform/build-news-maintenance-command-20261028.cjs
ARG RAILWAY_GIT_COMMIT_SHA
RUN node scripts/platform/build-combined-210-release-20261119.cjs

FROM base AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update && apt-get install --yes --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=dependencies --chown=nextjs:nodejs /app/bin/traderlink-integrity-cache-release ./bin/traderlink-integrity-cache-release
COPY --from=builder --chown=nextjs:nodejs /app/erasure-worker ./workers
COPY --from=builder --chown=nextjs:nodejs /app/demo-worker/ ./workers/
COPY --from=builder --chown=nextjs:nodejs /app/news-maintenance/news-general-0185-maintenance.cjs ./workers/news-general-0185-maintenance.cjs

COPY --from=builder --chown=nextjs:nodejs /app/analyzer-maintenance/migrate.cjs ./analyzer-0186-migrate.cjs
RUN mv /app/server.js /app/application-server.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/analyzer-image-entrypoint.cjs ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts/platform/analyzer-exact-ledger.json /app/scripts/platform/analyzer-image-role.json ./
COPY --from=builder --chown=nextjs:nodejs /app/combined210-package/ ./

COPY --from=builder /app/src/scripts/render-public-gainers-request.py /app/src/scripts/render-daily-gainers-preview.py /app/src/scripts/daily-gainers-preview.html /app/src/scripts/daily-gainers-public-nav.html /app/src/scripts/

USER root
EXPOSE 3000

CMD ["node", "server.js"]

FROM runtime AS image-census
USER root
COPY --from=runtime / /tmp/final-image-root/
RUN node -e 'const fs=require("node:fs"),cp=require("node:child_process"),c=require("node:crypto"),a=require("node:assert/strict");const hash=b=>c.createHash("sha256").update(b).digest("hex");const roleSha=hash(fs.readFileSync("/app/combined210-image-role.json"));const p=cp.spawnSync("/usr/bin/python3",["-I","-B","/app/combined210-resource-collector.py","emit-image-census","--root","/tmp/final-image-root","--role-sha256",roleSha],{encoding:"utf8",timeout:125000,maxBuffer:67108864});a.equal(p.status,0,p.stderr||"Final-image metadata collection failed");const data=JSON.parse(p.stdout);a.equal(data.unknownCount,0);a.equal(data.roleSha256,roleSha);a.equal(data.kind,"FINAL_IMAGE_METADATA_CENSUS_V1");a(Buffer.byteLength(p.stdout)<=67108864);fs.writeFileSync("/tmp/final-image-census.json",p.stdout,{flag:"wx",mode:256});console.log(JSON.stringify({stage:"combined210_final_image_census",source:data.source,roleSha256:roleSha,censusSha256:hash(Buffer.from(p.stdout)),bytes:Buffer.byteLength(p.stdout),entries:data.entries.length,unknownCount:data.unknownCount}));'

FROM runtime AS production
USER root
COPY --from=image-census --chown=nextjs:nodejs /tmp/final-image-census.json /app/combined210-image-census.json
