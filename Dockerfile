FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY server.js ./server.js
COPY src/scripts/cleanup-watchlist-release-checkpoints.mjs ./src/scripts/cleanup-watchlist-release-checkpoints.mjs

EXPOSE 3000

CMD ["node", "server.js"]
