// Staging-only single-volume release guard. Never migrates or starts workers itself.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const Database = require('better-sqlite3');
assert.equal(process.env.RAILWAY_PROJECT_ID, '49fc9197-07c9-45c7-b528-57d0393c2cca');
assert.equal(process.env.RAILWAY_ENVIRONMENT_ID, '9e079dd4-f3f3-4872-9b00-adbd3000c485');
assert.equal(process.env.RAILWAY_SERVICE_ID, '4d264aca-510c-4f5e-bc28-e89e526b8008');
assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH, '/data/traderlink-platform.sqlite');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'staging-release-manifest-20261016.json'), 'utf8'));
const db = new Database(process.env.TRADERLINK_PLATFORM_DB_PATH, {readonly:true, fileMustExist:true});
db.pragma('query_only=ON');
const rows = db.prepare('SELECT migration_id,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
db.close();
assert([171,172].includes(rows.length), 'Unexpected migration state: keep this deployment closed');
assert.deepEqual(rows, expected.slice(0,rows.length));
assert(['recovery','final'].includes(process.env.TRADERLINK_STAGING_IMAGE_ROLE));
if (rows.length === 171) {
  // Prebuild both exact schema-compatible images before the volume migration.
  // The Coordinator performs the guarded 0176 migration separately over SSH.
  http.createServer((req,res) => {
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    res.statusCode=req.url==='/api/platform/health'?200:503;
    res.end(JSON.stringify({status:'maintenance_ready',role:process.env.TRADERLINK_STAGING_IMAGE_ROLE,migrationCount:171,expectedMigrationCount:172,source:process.env.RAILWAY_GIT_COMMIT_SHA}));
  }).listen(Number(process.env.PORT||3000),'0.0.0.0');
  console.log(JSON.stringify({stage:'image_prebuilt_awaiting_guarded_migration',role:process.env.TRADERLINK_STAGING_IMAGE_ROLE,migrationCount:171,expectedMigrationCount:172}));
} else {
  // Child-process-only compatibility controls; no Railway variable is changed.
  delete process.env.TRADERLINK_PLATFORM_RUNTIME_COMPATIBILITY_MIGRATION_ID;
  delete process.env.TRADERLINK_PLATFORM_RUNTIME_COMPATIBILITY_PREDECESSOR_COUNT;
  console.log(JSON.stringify({stage:'staging_application_start',role:process.env.TRADERLINK_STAGING_IMAGE_ROLE,migrationCount:rows.length}));
  require(path.join(process.cwd(),'server.js'));
}
