'use strict';
// Same-service built-image qualification, before Railway mounts the volume.
// Deliberately no application imports, database constructor/SQL, HTTP/provider
// calls, key material, filesystem writes or protocol-state creation.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const MAX_MANIFEST=1024*1024;
function bytes(file,maximum){
 a.equal(path.normalize(file),file);a(file.startsWith('/app/'));
 let parent='/';for(const part of path.dirname(file).split('/').filter(Boolean)){
  parent=path.join(parent,part);const d=fs.lstatSync(parent);a(d.isDirectory()&&!d.isSymbolicLink());
 }
 a.equal(fs.realpathSync(file),file);
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const s=fs.fstatSync(fd);a(s.isFile());a.equal(s.nlink,1);a(s.size>0&&s.size<=maximum);const b=fs.readFileSync(fd);a.equal(b.length,s.size);return b;}
 finally{fs.closeSync(fd);}
}
function main(){
 a.equal(process.getuid(),0);a.equal(process.getgid(),0);a.equal(process.cwd(),'/app');
 a.equal(process.platform,'linux');a.equal(process.versions.node.split('.')[0],'24');a.equal(process.versions.modules,'137');
 const roleBytes=bytes('/app/combined210-image-role.json',MAX_MANIFEST),role=JSON.parse(roleBytes);
 a(['final210','recovery210'].includes(role.role));a.equal(role.targetCount,210);
 a.equal(role.expectedRuntimeUid,0);a.equal(role.expectedRuntimeGid,0);
 a.equal(role.projectId,'49fc9197-07c9-45c7-b528-57d0393c2cca');
 a.equal(role.environmentId,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');a.equal(role.serviceId,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');
 for(const [key,v]of Object.entries({RAILWAY_PROJECT_ID:role.projectId,RAILWAY_ENVIRONMENT_ID:role.environmentId,RAILWAY_SERVICE_ID:role.serviceId}))a.equal(process.env[key],v);
 a.match(process.env.RAILWAY_DEPLOYMENT_ID||'',/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u);
 a.match(role.applicationSource,/^[a-f0-9]{40}$/u);a.equal(process.env.RAILWAY_GIT_COMMIT_SHA,role.applicationSource);
 a.match(role.schemaSha256,/^[a-f0-9]{64}$/u);
 const pins=Object.entries(role.installedSourcePins||{});a(pins.length>=4&&pins.length<=1000);
 const hashes=[];const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const [file,expected]of pins){a.match(expected,/^[a-f0-9]{64}$/u);const raw=bytes(file,128*1024*1024);a.equal(hash(raw),expected);hashes.push([file,expected]);}
 a(pins.some(([p])=>p==='/app/combined210-image-predeploy.cjs'));a(pins.some(([p])=>p==='/app/combined-210-control-20261119.cjs'));
 a.equal(hash(bytes('/app/application-server.js',128*1024*1024)),role.applicationEntrySha256);
 a.equal(hash(bytes('/app/combined210-readonly-verifier.cjs',128*1024*1024)),role.readOnlyVerifierSha256);
 const packageJson=JSON.parse(bytes('/app/node_modules/better-sqlite3/package.json',65536));a.equal(packageJson.version,'12.9.0');
 // Loading the addon checks the actual Node ABI without creating a Database.
 const native='/app/node_modules/better-sqlite3/build/Release/better_sqlite3.node';
 const nativeHash=hash(bytes(native,32*1024*1024));const addon=require(native);a.equal(typeof addon.Database,'function');
 a.equal(fs.realpathSync(native),native);
 const py=cp.spawnSync('/usr/bin/python3',['-I','-B','-c','import json,sys; assert sys.dont_write_bytecode; print(json.dumps({"major":sys.version_info.major,"minor":sys.version_info.minor,"dontWriteBytecode":sys.dont_write_bytecode}))'],
  {encoding:'utf8',timeout:5000,maxBuffer:1024,env:{PATH:'/usr/bin:/bin',PYTHONDONTWRITEBYTECODE:'1'}});
 a.equal(py.status,0,py.stderr);const python=JSON.parse(py.stdout);a.equal(python.major,3);a(python.minor>=11);
 const mounts=fs.readFileSync('/proc/self/mountinfo','utf8');a(!mounts.split('\n').some(line=>line.split(' ')[4]==='/data'));
 const censusBytes=bytes('/app/combined210-image-census.json',64*1024*1024),census=JSON.parse(censusBytes);
 a.equal(census.kind,'FINAL_IMAGE_METADATA_CENSUS_V1');a.equal(census.unknownCount,0);a.equal(census.source,role.applicationSource);
 a.equal(census.roleSha256,hash(roleBytes));a(Array.isArray(census.entries)&&census.entries.length>0&&census.entries.length<=250000);
 const proof={kind:'ACTUAL_SAME_SERVICE_210_PREDEPLOY_IMAGE_QUALIFICATION',atUtc:new Date().toISOString(),
  deploymentId:process.env.RAILWAY_DEPLOYMENT_ID,source:role.applicationSource,role:role.role,
  manifestSha256:hash(roleBytes),installedPinsSha256:hash(Buffer.from(JSON.stringify(hashes))),installedPinCount:pins.length,
  imageCensusSha256:hash(censusBytes),imageCensusBytes:censusBytes.length,imageCensusEntryCount:census.entries.length,
  uid:process.getuid(),gid:process.getgid(),node:process.versions.node,abi:process.versions.modules,nativePackage:packageJson.version,nativeSha256:nativeHash,python,
  volumeMounted:false,databaseOpened:false,applicationImported:false,providerRequests:0,filesystemWrites:0,
  scope:'Built image/source and ABI qualification only. Keeper hold is not normal application readiness; full migration, configuration and activation gates remain.'};
 process.stdout.write(JSON.stringify(proof)+'\n');return proof;
}
if(require.main===module)main();
module.exports={main};
