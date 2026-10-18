const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
require('./deny-external.cjs');
const requireApp = require('node:module').createRequire(path.join(process.cwd(),'package.json'));
const Module = require('node:module'), originalLoad = Module._load;
Module._load = function(id,...args) { return id === 'server-only' ? {} : originalLoad.call(this,id,...args); };
requireApp('tsx/cjs');
const Database = requireApp('better-sqlite3');
const fixture = JSON.parse(fs.readFileSync(process.env.MEMBERSHIP_QA_FIXTURE,'utf8'));
assert(fixture.dir.startsWith('/workspaces/private-data/membership-qa-fixtures/run-'));
assert.equal(fixture.env.TRADERLINK_PLATFORM_DB_PATH,path.join(fixture.dir,'qa.sqlite'));
(async()=>{
  const dir=fs.mkdtempSync('/workspaces/private-data/membership-qa-fixtures/run-analyzer-');
  fs.chmodSync(dir,0o700);
  const env={...fixture.env,TRADERLINK_PLATFORM_DB_PATH:path.join(dir,'qa.sqlite')};
  for(const [key,sub] of [['TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT','vault'],['TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT','uploads']]) {
    fs.mkdirSync(path.join(dir,sub)); env[key]=path.join(dir,sub);
  }
  fs.mkdirSync(path.join(dir,'protected')); env.TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON=JSON.stringify([path.join(dir,'protected')]);
  const clone={...fixture,dir,env};
  fs.writeFileSync(path.join(dir,'fixture.json'),JSON.stringify(clone),{mode:0o600});
  const source = new Database(fixture.env.TRADERLINK_PLATFORM_DB_PATH,{readonly:true});
  try { await source.backup(env.TRADERLINK_PLATFORM_DB_PATH); } finally { source.close(); }
  Object.assign(process.env,env);
  const db=new Database(env.TRADERLINK_PLATFORM_DB_PATH); db.pragma('foreign_keys=ON');
  try {
    const {PlatformMembershipRepository}=requireApp('./src/modules/platform/server/membership/platform-membership-repository.ts');
    const {readGenerationAllowance}=requireApp('./src/modules/platform/server/membership/platform-membership-generation-allowance.ts');
    const at=new Date().toISOString(), owner=fixture.users.owner.userId;
    const version=db.prepare("SELECT v.plan_version_id FROM platform_membership_plan_versions v JOIN platform_membership_plans p USING(plan_id) WHERE p.name='QA Public P' AND v.lifecycle_state='published' ORDER BY v.version_number DESC LIMIT 1").get();
    assert(version);
    for(const name of ['A','B']) {
      if(!db.prepare("SELECT 1 FROM platform_membership_entitlements WHERE user_id=? AND status='active'").get(fixture.users[name].userId))
        new PlatformMembershipRepository(db).grantEntitlement({actorUserId:owner,userId:fixture.users[name].userId,
          planVersionId:version.plan_version_id,sourceType:'owner_grant',sourceRef:'synthetic-quota-only',startsAtUtc:at,endsAtUtc:null,reason:'Synthetic isolated quota proof'});
    }
    db.prepare('INSERT OR REPLACE INTO platform_membership_feature_policies VALUES (?,?,?,?)').run('trade_analyzer.analyses','enforced',owner,at);
    const result=require('./analyzer-usage.cjs')(db,fixture.users.A.userId,fixture.users.B.userId,readGenerationAllowance);
    fs.mkdirSync(path.join(dir,'evidence'));
    fs.writeFileSync(path.join(dir,'evidence','analyzer-result.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({...result,fixture:path.join(dir,'fixture.json')}));
  } finally { db.close(); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
