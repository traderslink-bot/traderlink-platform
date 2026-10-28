'use strict';
// Release-only compatibility/maintenance gate. Never initializes or migrates.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),http=require('node:http'),Database=require('better-sqlite3');
const folder=path.join(process.cwd(),'scripts/platform');
assert.equal(process.env.RAILWAY_PROJECT_ID,'49fc9197-07c9-45c7-b528-57d0393c2cca');
assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');
assert.equal(process.env.RAILWAY_SERVICE_ID,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,'/data/traderlink-platform.sqlite');
assert(!process.env.TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID&&!process.env.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM);
const marker=JSON.parse(fs.readFileSync(path.join(folder,'general-news-image-source-20261028.json'),'utf8'));
assert(['recovery','final'].includes(marker.role));assert.equal(marker.expectedMigrationCount,149);
const expected=JSON.parse(fs.readFileSync(path.join(folder,'general-news-release-manifest-20261028.json'),'utf8'));
assert.equal(expected.length,149);assert.equal(expected.at(-1).migration_id,'0185_news_general_market_news');
assert.equal(expected.at(-1).execution_order,222);assert.equal(expected.at(-1).checksum_sha256,'1b5a60eb69f14a3965c595068f6aef72ff7bcf8676d40a4c5dfea08be8069b72');
delete process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX;
const knownSchemas={148:'b4c55d190fed07b3b0a4b54309511d2e5a9d8368aea1840e42253c03f4d26d65',149:'f8ee64f9b93b595929c764128b52e9f15fda6ea58cab9ecedc3bfb8d6061d33e'};
const db=new Database('/data/traderlink-platform.sqlite',{readonly:true,fileMustExist:true,timeout:5000});let count;
try{
 db.pragma('query_only=ON');
 const rows=db.prepare('SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
 count=rows.length;assert([148,149].includes(count));assert.deepEqual(rows,expected.slice(0,count));
 const schema=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE type IN ('table','index','view','trigger') AND substr(name,1,7)<>'sqlite_' ORDER BY type COLLATE BINARY,name COLLATE BINARY,tbl_name COLLATE BINARY").all().map(r=>[r.type,r.name,r.tbl_name,r.sql.replace(/\r\n?/g,'\n')]);
 const actual=crypto.createHash('sha256').update(JSON.stringify(schema)+'\n').digest('hex');
 assert.equal(actual,knownSchemas[count]);assert.equal(actual,db.prepare('SELECT post_schema_sha256 digest FROM platform_schema_migrations ORDER BY execution_order DESC LIMIT 1').get().digest);
}finally{db.close();}
const control=process.env.TRADERLINK_GENERAL_NEWS_MAINTENANCE_WINDOW;
if(marker.role==='recovery'){
 // Only the separately reviewed recovery carrier contains this exact two-prefix selector.
 process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX=String(count);
 console.log(JSON.stringify({stage:'news_schema_compatible_recovery_start',migrationCount:count}));
 require(path.join(process.cwd(),'application-server.js'));
}else if(count===149){
 // Restart retains deployment variables. The 148-only window control is inert
 // after exact149 proof; clear it before normal app/workers, without a rebuild.
 delete process.env.TRADERLINK_GENERAL_NEWS_MAINTENANCE_WINDOW;
 // Preserve the accepted normal149 gate; no maintenance or prefix bypass here.
 require(path.join(folder,'general-news-release-entrypoint-20261028.cjs'));
}else{
 assert.equal(control,'news-general-0185-window-20261028-after-2000-et');
 assert(Date.now()>=Date.parse('2026-10-28T23:25:00Z'),'owner maintenance timing has not begun');
 const page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TradersLink maintenance</title><h1>TradersLink is undergoing maintenance</h1><p>Please try again shortly.</p></html>';
 http.createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');response.setHeader('Retry-After','60');
  if(request.url==='/api/platform/health'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({status:'maintenance_ready',role:'final',migrationCount:count,expectedMigrationCount:149}));}
  else{response.statusCode=503;response.setHeader('Content-Type','text/html; charset=utf-8');response.end(page);}
 }).listen(Number(process.env.PORT||3000),'0.0.0.0');
 console.log(JSON.stringify({stage:'news_prebuilt_final_waiting_guarded_migration',migrationCount:count,expectedMigrationCount:149}));
}
