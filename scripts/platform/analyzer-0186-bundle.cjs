'use strict';
const fs = require('node:fs');
require('esbuild').buildSync({
  entryPoints: ['scripts/platform/analyzer-0186-migrate.cjs'],
  outfile: '/app/analyzer-maintenance/migrate.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  conditions: ['react-server'],
  external: ['better-sqlite3'],
  define: { 'import.meta.url': '__platform_config_url' },
  banner: { js: 'const __platform_config_url=require("node:url").pathToFileURL("/app/src/modules/platform/server/database/platform-database-config.ts").href;' },
});
