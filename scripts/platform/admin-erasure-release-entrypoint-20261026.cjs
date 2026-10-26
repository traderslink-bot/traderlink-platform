'use strict';
// Release-only gate. It never migrates, starts a writer, or accepts a requested prefix.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),http=require('node:http'),Database=require('better-sqlite3');
const folder=path.join(process.cwd(),'scripts/platform');
const marker=JSON.parse(fs.readFileSync(path.join(folder,'admin-erasure-release-image-20261026.json'),'utf8'));
const expected=JSON.parse(fs.readFileSync(path.join(folder,'admin-erasure-release-manifest-20261026.json'),'utf8'));
assert.equal(process.env.RAILWAY_PROJECT_ID,'49fc9197-07c9-45c7-b528-57d0393c2cca');
assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');
assert.equal(process.env.RAILWAY_SERVICE_ID,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,'/data/traderlink-platform.sqlite');
assert(['recovery','final'].includes(marker.role));assert.equal(expected.length,148);
delete process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX;
const db=new Database('/data/traderlink-platform.sqlite',{readonly:true,fileMustExist:true});let count;
try{
 db.pragma('query_only=ON');
 const rows=db.prepare('SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();
 count=rows.length;assert([146,147,148].includes(count),'unexpected release migration count');assert.deepEqual(rows,expected.slice(0,count));
 const schema=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE type IN ('table','index','view','trigger') AND substr(name,1,7)<>'sqlite_' ORDER BY type COLLATE BINARY,name COLLATE BINARY,tbl_name COLLATE BINARY").all().map(r=>[r.type,r.name,r.tbl_name,r.sql.replace(/\r\n?/g,'\n')]);
 const actual=crypto.createHash('sha256').update(JSON.stringify(schema)+'\n').digest('hex');
 assert.equal(actual,db.prepare('SELECT post_schema_sha256 digest FROM platform_schema_migrations ORDER BY execution_order DESC LIMIT 1').get().digest);
}finally{db.close();}
if(marker.role==='recovery'){
 // Only this isolated compatibility carrier includes the matching prefix selector.
 // Its UI/application is the previously healthy production source, not the new feature.
 process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX=String(count);
 console.log(JSON.stringify({stage:'schema_compatible_recovery_start',migrationCount:count,role:marker.role}));
 require(path.join(process.cwd(),'application-server.js'));
}else if(count===148){
 console.log(JSON.stringify({stage:'reviewed_final_application_start',migrationCount:count,role:marker.role}));
 require(path.join(process.cwd(),'application-server.js'));
}else{
 const page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TradersLink maintenance</title><h1>TradersLink is undergoing maintenance</h1><p>Please try again shortly.</p></html>';
 http.createServer((request,response)=>{
  response.setHeader('Cache-Control','no-store');response.setHeader('Retry-After','60');
  if(request.url==='/api/platform/health'){
   response.setHeader('Content-Type','application/json');response.end(JSON.stringify({status:'maintenance_ready',role:marker.role,migrationCount:count,expectedMigrationCount:148}));
  }else{response.statusCode=503;response.setHeader('Content-Type','text/html; charset=utf-8');response.end(page);}
 }).listen(Number(process.env.PORT||3000),'0.0.0.0');
 console.log(JSON.stringify({stage:'prebuilt_final_waiting_guarded_migration',migrationCount:count,expectedMigrationCount:148}));
}
