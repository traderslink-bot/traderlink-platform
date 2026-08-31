FROM node:24-bookworm-slim AS base

WORKDIR /app

FROM base AS dependencies
RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS initializer
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

CMD ["sh", "-c", "set -eu; database_path=${TRADERLINK_PLATFORM_DB_PATH:-}; if [ \"${RAILWAY_VOLUME_MOUNT_PATH:-}\" != \"/data\" ] || [ \"$database_path\" != \"/data/traderlink-platform.sqlite\" ]; then echo '{\"code\":\"TRADERLINK_STAGING_INITIALIZER_DATABASE_PATH_INVALID\"}' >&2; exit 64; fi; for existing_path in \"$database_path\" \"$database_path-wal\" \"$database_path-shm\" \"$database_path-journal\"; do if [ -e \"$existing_path\" ] || [ -L \"$existing_path\" ]; then echo '{\"code\":\"TRADERLINK_STAGING_INITIALIZER_DATABASE_ALREADY_EXISTS\"}' >&2; exit 65; fi; done; if [ ! -d /data ]; then echo '{\"code\":\"TRADERLINK_STAGING_INITIALIZER_VOLUME_NOT_EMPTY\"}' >&2; exit 66; fi; for volume_entry in /data/* /data/.[!.]* /data/..?*; do if [ ! -e \"$volume_entry\" ] && [ ! -L \"$volume_entry\" ]; then continue; fi; if [ \"$volume_entry\" = \"/data/lost+found\" ] && [ -d \"$volume_entry\" ] && [ ! -L \"$volume_entry\" ]; then lost_found_entry=$(find \"$volume_entry\" -mindepth 1 -maxdepth 1 -print -quit) || { echo '{\"code\":\"TRADERLINK_STAGING_INITIALIZER_VOLUME_NOT_EMPTY\"}' >&2; exit 66; }; if [ -z \"$lost_found_entry\" ]; then continue; fi; fi; echo '{\"code\":\"TRADERLINK_STAGING_INITIALIZER_VOLUME_NOT_EMPTY\"}' >&2; exit 66; done; umask 077; mkdir /data/evidence-vault /data/upload-staging /data/backups; exec /app/node_modules/.bin/tsx src/scripts/initialize-traderlink-platform-database.ts --initialize-empty"]
