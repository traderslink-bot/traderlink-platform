// Compiled local browser QA only. Disable hosted scheduler/migration bootstrap;
// routes, server actions, real session authorization and repositories remain intact.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
assert.equal(process.env.MEMBERSHIP_QA_COMPILED, '1');
const fixture=JSON.parse(fs.readFileSync(process.env.MEMBERSHIP_QA_FIXTURE,'utf8'));
assert(fixture.dir.startsWith('/workspaces/private-data/membership-qa-fixtures/run-'));
assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,path.join(fixture.dir,'qa.sqlite'));
const Module=require('node:module'), original=Module._load;
const target=path.join(process.cwd(),'.next','server','instrumentation.js');
Module._load=function(id,...args) {
  if(id===target) return {register:async()=>{
    fs.writeFileSync(path.join(process.env.MEMBERSHIP_QA_EVIDENCE,'compiled-runtime-boundary.json'),JSON.stringify({
      hostedBootstrap:'disabled for disposable compiled QA',applicationSourceOverlay:false,
      sessionsAndAuthorization:'real production path',externalTransports:'denied',
    },null,2));
    process.stdout.write('Synthetic compiled QA: hosted scheduler bootstrap disabled\n');
  }};
  return original.call(this,id,...args);
};
