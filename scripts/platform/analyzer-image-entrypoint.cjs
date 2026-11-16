'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

function selectSchema(plan, role, rows, schema, latestDigest) {
  assert(['final', 'recovery', 'migration'].includes(role));
  const targetCount = plan.ledger.length;
  const precedingCount = plan.predecessorCount ?? targetCount - 1;
  assert(rows.length === targetCount || (['recovery', 'migration'].includes(role) && rows.length === precedingCount));
  assert.deepEqual(rows, plan.ledger.slice(0, rows.length));
  const digest = crypto.createHash('sha256').update(JSON.stringify(schema) + '\n').digest('hex');
  assert.equal(digest, rows.length === precedingCount ? plan.predecessorSchemaSha256 : plan.targetSchemaSha256);
  assert.equal(digest, latestDigest);
  return rows.length;
}

function main() {
  const env = process.env;
  assert.equal(env.RAILWAY_PROJECT_ID, '49fc9197-07c9-45c7-b528-57d0393c2cca');
  assert.equal(env.RAILWAY_ENVIRONMENT_ID, '666e1624-a1eb-4e94-8e16-5ed73ad4b4af');
  assert.equal(env.RAILWAY_SERVICE_ID, 'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
  assert.equal(env.TRADERLINK_PLATFORM_DB_PATH, '/data/traderlink-platform.sqlite');
  assert(!env.TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID && !env.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM);
  const { role } = require('./analyzer-image-role.json');
  const plan = require('./analyzer-exact-ledger.json');
  const Database = require('better-sqlite3');
  const db = new Database(env.TRADERLINK_PLATFORM_DB_PATH, { readonly: true, fileMustExist: true, timeout: 5000 });
  let count;
  try {
    db.pragma('query_only = ON');
    const rows = db.prepare('SELECT migration_id, module_namespace, execution_order, checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
    const schema = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE type IN ('table','index','view','trigger') AND substr(name,1,7)<>'sqlite_' ORDER BY type COLLATE BINARY,name COLLATE BINARY,tbl_name COLLATE BINARY").all()
      .map(row => [row.type, row.name, row.tbl_name, row.sql.replace(/\r\n?/g, '\n')]);
    const digest = db.prepare('SELECT post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order DESC LIMIT 1').get().post_schema_sha256;
    count = selectSchema(plan, role, rows, schema, digest);
  } finally {
    db.close();
  }
  if (role === 'migration' && count === (plan.predecessorCount ?? plan.ledger.length - 1)) {
    const port = Number(env.PORT || 3000);
    require('node:http').createServer((request, response) => {
      response.setHeader('Cache-Control', 'no-store');
      if (request.url === '/api/platform/health') {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ status: 'maintenance_ready', migrationCount: count, deployment: env.RAILWAY_DEPLOYMENT_ID, pid: process.pid }));
      } else {
        response.writeHead(503, { 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('TradersLink is undergoing scheduled maintenance.');
      }
    }).listen(port, '0.0.0.0');
    return;
  }
  delete env.TRADERLINK_RECOVERY_SCHEMA_PREFIX;
  delete env.TRADERLINK_GENERAL_NEWS_MAINTENANCE_WINDOW;
  delete env.TRADERLINK_PLATFORM_RUNTIME_COMPATIBILITY_MIGRATION_ID;
  if (count === plan.ledger.length - 1) env.TRADERLINK_PLATFORM_RUNTIME_COMPATIBILITY_MIGRATION_ID = plan.ledger.at(-1).migration_id;
  console.log(JSON.stringify({ stage: 'platform_schema_start', role, migrationCount: count }));
  require(path.join(__dirname, 'application-server.js'));
}

if (require.main === module) main();
module.exports = { selectSchema };
