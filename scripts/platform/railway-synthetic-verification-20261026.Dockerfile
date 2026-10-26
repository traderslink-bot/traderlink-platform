FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --omit=dev --no-audit --no-fund better-sqlite3@12.9.0
COPY synthetic-api.cjs maintenance-sqlite-io-policy.cjs railway-synthetic-verification-20261026.cjs ./
ENV NODE_ENV=test NODE_OPTIONS=--max-old-space-size=2048
CMD ["timeout", "--signal=TERM", "--kill-after=10s", "4200s", "node", "/app/railway-synthetic-verification-20261026.cjs"]
