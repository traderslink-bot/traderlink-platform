'use strict';
// Normal application only: no initialization, migration, backup or maintenance server.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Database=require('better-sqlite3');
assert.equal(process.env.RAILWAY_PROJECT_ID,'49fc9197-07c9-45c7-b528-57d0393c2cca');
assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');
assert.equal(process.env.RAILWAY_SERVICE_ID,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,'/data/traderlink-platform.sqlite');
assert(!process.env.TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID&&!process.env.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM,'maintenance controls must be removed before normal application startup');
delete process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX;
const expected=JSON.parse(fs.readFileSync(path.join(process.cwd(),'scripts/platform/general-news-release-manifest-20261028.json'),'utf8'));
assert.equal(expected.length,149);
assert.equal(expected.at(-1).migration_id,'0185_news_general_market_news');
assert.equal(expected.at(-1).execution_order,222);
assert.equal(expected.at(-1).checksum_sha256,'1b5a60eb69f14a3965c595068f6aef72ff7bcf8676d40a4c5dfea08be8069b72');
const db=new Database('/data/traderlink-platform.sqlite',{readonly:true,fileMustExist:true,timeout:5000});
try{
 db.pragma('query_only=ON');
 const rows=db.prepare('SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
 assert.deepEqual(rows,expected,'normal application requires the exact reviewed149 migration identities');
 const schema=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE type IN ('table','index','view','trigger') AND substr(name,1,7)<>'sqlite_' ORDER BY type COLLATE BINARY,name COLLATE BINARY,tbl_name COLLATE BINARY").all().map(r=>[r.type,r.name,r.tbl_name,r.sql.replace(/\r\n?/g,'\n')]);
 const actual=crypto.createHash('sha256').update(JSON.stringify(schema)+'\n').digest('hex');
 assert.equal(actual,db.prepare('SELECT post_schema_sha256 digest FROM platform_schema_migrations ORDER BY execution_order DESC LIMIT 1').get().digest,'physical schema must match the recorded completed migration');
}finally{db.close();}
console.log(JSON.stringify({stage:'reviewed_general_news_application_start',migrationCount:149}));
require(path.join(process.cwd(),'application-server.js'));
