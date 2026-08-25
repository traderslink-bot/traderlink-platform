#!/bin/sh
set -eu

if [ "${RAILWAY_ENVIRONMENT_NAME:-}" != "staging" ]; then
  echo "The staging runtime entrypoint may only run in Railway staging."
  exit 1
fi

mkdir -p /data/evidence-vault /data/upload-staging /data/backups
chown -R nextjs:nodejs /data

exec su -s /bin/sh nextjs -c 'exec node server.js'
