'use strict';
// Exact211 source preparation: compile with the ACTUAL211 release manifest, not a copied descriptor
// list. Import is inert. No Auth, normal app bootstrap, or provider calls.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const quote=value=>'"'+value.replaceAll('"','""')+'"';
function api(){
  return {Database:require('better-sqlite3'),
    ...require('../../src/modules/platform/server/database/run-platform-migrations.ts'),
    ...require('../../src/modules/platform/server/database/platform-migration-registry.ts'),
    ...require('../../src/modules/platform/server/database/platform-migration-manifest.ts'),
    ...require('../../src/modules/platform/server/database/open-platform-database.ts')};
}
function noLinks(file,directory=false){a(path.isAbsolute(file)&&path.normalize(file)===file);let p='/';
  for(const part of file.split('/').filter(Boolean)){p=path.join(p,part);const s=fs.lstatSync(p);a(!s.isSymbolicLink());if(p!==file||directory)a(s.isDirectory());}
  const s=fs.lstatSync(file,{bigint:true});a(directory?s.isDirectory():s.isFile()&&s.nlink===1n);return s;}
function identity(file){const s=noLinks(file);return {device:String(s.dev),inode:String(s.ino),uid:String(s.uid),bytes:String(s.size),allocatedBytes:String(s.blocks*512n)};}
function hashFile(file,guard=()=>{}){const before=identity(file),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  const h=crypto.createHash('sha256'),b=Buffer.alloc(1024*1024);try{
    a.equal(String(fs.fstatSync(fd,{bigint:true}).ino),before.inode);
    for(;;){guard();const n=fs.readSync(fd,b,0,b.length,null);if(!n)break;h.update(b.subarray(0,n));}
    a.deepEqual(identity(file),before);return h.digest('hex');
  }finally{fs.closeSync(fd);}}
function open(file,readonly=true){noLinks(file);const x=api(),db=new x.Database(file,{readonly,fileMustExist:true,timeout:5000});
  try{db.pragma('foreign_keys=ON');db.pragma('busy_timeout=5000');return db;}catch(error){db.close();throw error;}}
function fieldHash(h,value){if(value===null)return h.update('N;');let tag,b;
  if(typeof value==='bigint'){tag='I';b=Buffer.from(String(value));}else if(typeof value==='number'){tag='R';b=Buffer.alloc(8);b.writeDoubleBE(value);}
  else if(typeof value==='string'){tag='T';b=Buffer.from(value);}else{a(Buffer.isBuffer(value));tag='B';b=value;}
  h.update(tag+b.length+':');h.update(b);h.update(';');}
// Stream original columns only, with hidden rowid when available and exact
// SQLite type + byte encodings. No in-memory table aggregation or SQL sort spill.
function dataSnapshot(db,original=null,guard=()=>{}){const x=api();
  const tables=original?original.map(t=>t.table):x.listPlatformUserTableNames(db).filter(t=>t!=='platform_schema_migrations');
  return tables.map((table,index)=>{guard();const info=db.prepare('PRAGMA table_xinfo('+quote(table)+')').all();a(info.length);
    const columns=original?original[index].columns:info.map(c=>c.name);for(const c of columns)a(info.some(v=>v.name===c),'original_column_removed');
    const without=db.prepare('SELECT wr FROM pragma_table_list WHERE name=? AND schema=?').get(table,'main').wr;
    const rowid=without?null:original?original[index].rowid:['_rowid_','rowid','oid'].find(c=>!columns.includes(c));
    const order=rowid?quote(rowid):info.filter(c=>c.pk>0).sort((a,b)=>a.pk-b.pk).map(c=>quote(c.name)).join(',');a(order,'deterministic_order_required');
    const selected=[...(rowid?[rowid]:[]),...columns].flatMap(c=>['typeof('+quote(c)+')',"CASE WHEN typeof("+quote(c)+")='text' THEN CAST("+quote(c)+" AS BLOB) ELSE "+quote(c)+' END']).join(',');
    // The exact210 predecessor ALREADY contains its retained erasure principal.
    // These two new migrations do not create an authorized row exception. Hash
    // every original row/column, including the retained principal, without filters.
    const where='';
    const statement=db.prepare('SELECT '+selected+' FROM '+quote(table)+where+' ORDER BY '+order).raw(true).safeIntegers(true);
    const h=crypto.createHash('sha256');let count=0;for(const row of statement.iterate()){if(count++%4096===0)guard();h.update('ROW[');
      for(let i=0;i<row.length;i+=2){h.update(row[i]+':');fieldHash(h,row[i+1]);}h.update(']');}
    return {table,columns,rowid,count,sha256:h.digest('hex')};});}
function verifyStructure(input){const x=api(),db=open(input.databasePath);try{
  a.equal(x.platformMigrationManifest.length,211);
  const result=x.verifyPlatformMaintenancePreflightStructure(db,x.platformMigrationManifest);
  a.equal(result.finalSchemaSha256,input.expectedSchemaSha256);
  return {count:211,schemaSha256:result.finalSchemaSha256,appliedLedgerSha256:sha(JSON.stringify(x.readAppliedPlatformMigrations(db)))};
}finally{db.close();}}
function verifyFullFile(input){const x=api(),db=open(input.databasePath);try{
  const manifest=x.platformMigrationManifest.slice(0,input.count);a.equal(manifest.length,input.count);
  const result=x.verifyCompletedPlatformDatabase(db,manifest);a.equal(result.finalSchemaSha256,input.expectedSchemaSha256);
  const ledger=x.readAppliedPlatformMigrations(db);if(input.originalLedger)a.deepEqual(ledger.slice(0,input.originalLedger.length),input.originalLedger);
  const data=dataSnapshot(db,input.originalData||null,input.guard);
  if(input.originalData)a.deepEqual(data,input.originalData,'original_data_changed');
  return {count:input.count,schemaSha256:result.finalSchemaSha256,ledger,data,foreignKeys:'ok',quickCheck:'ok',
    identity:identity(input.databasePath),fileSha256:hashFile(input.databasePath,input.guard)};
}finally{db.close();}}
module.exports={api,sha,noLinks,identity,hashFile,open,dataSnapshot,verifyStructure,verifyFullFile};
