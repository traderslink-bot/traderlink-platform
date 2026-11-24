'use strict';
// Compile as one native closure against the exact 211 News successor. No caller-supplied
// database, Core admission, Auth frame or owner-scope object is accepted.
// Import alone performs no database, key, profile, Auth or network operation.
const fs=require('node:fs'),a=require('node:assert/strict');
const control=require('./combined-210-control-20261119.cjs');
const originalSchema='9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89';
const targetSchema='e2b148f268e6ca409263612d1bc3b3457955db2e6ef07c390c3ba8a45e063016';
const reviewedProfile={
  profileRef:'community_account_erasure_210_v1',
  retentionPolicyRef:'paid_partner_retention_7d_v2',
  backupPolicyRef:'paid_partner_restore_safety_v2',
  validUntilUtc:'2027-11-19T05:14:42.950Z',
};

function rebindProfileSchema(db,command,schemaSha256,nowUtc){
  a(db.inTransaction,'profile rebind must share the owner audit transaction');
  a.equal(schemaSha256,targetSchema);
  a.deepEqual(command,{...reviewedProfile,expectedGeneration:command.expectedGeneration});
  a.equal(command.expectedGeneration,1,'unexpected existing profile generation');
  a(command.validUntilUtc>nowUtc);
  // This editorial-only suffix leaves the reviewed profile policy unchanged.
  // Existing live and in-progress erasure records bind the current generation.
  const result=db.prepare(`UPDATE platform_erasure_profiles SET schema_sha256=?
    WHERE profile_ref=? AND generation=? AND schema_sha256=? AND retention_policy_ref=?
      AND backup_policy_ref=? AND reference_policy='hold_signer_and_shared_owner'
      AND valid_until_utc=?`).run(schemaSha256,command.profileRef,command.expectedGeneration,
      originalSchema,command.retentionPolicyRef,command.backupPolicyRef,command.validUntilUtc);
  a.equal(result.changes,1,'original profile or generation changed');
}

function runNativeProfileSetup(input){return control.locked(input.protocolRoot,input.runId,()=>runWithinOwnedControl(input));}
function runWithinOwnedControl(input){
  a(input.request instanceof Request);
  const marker=control.read(input.protocolRoot+'/TARGET_WRITES_ADMITTED.json');
  a.equal(marker.runId,input.runId);a.equal(marker.purpose,'native_setup');
  a.equal(input.schemaSha256,targetSchema);a.equal(marker.targetSchemaSha256,targetSchema);
  a.equal(marker.targetSource,input.source);
  a.match(input.imageDigest,/^sha256:[a-f0-9]{64}$/u);a.equal(marker.imageDigest,input.imageDigest);
  a.match(input.nativeSetupAdmissionSha256,/^[a-f0-9]{64}$/u);
  a.equal(marker.admissionReceiptSha256,input.nativeSetupAdmissionSha256);
  const state=control.readState(input.protocolRoot,input.runId);a.equal(state.phase,'TARGET_WRITES_ADMITTED');
  a.equal(state.nativeSetupPending,true);
  a.equal(state.targetSource,input.source);a.equal(state.targetSchemaSha256,input.schemaSha256);
  a.equal(marker.verificationReceiptSha256,state.verificationReceiptSha256);
  a.equal(process.env.NODE_ENV,'production');a.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,input.databasePath);
  a.equal(process.env.RAILWAY_GIT_COMMIT_SHA,input.source);
  a.match(input.deployment,/^[a-f0-9-]{36}$/u);a.equal(process.env.RAILWAY_DEPLOYMENT_ID,input.deployment);
  a.equal(input.request.method,'POST');a(!input.request.signal.aborted);
  const command=structuredClone(input.command);
  a.deepEqual(Object.keys(command).sort(),['backupPolicyRef','expectedGeneration','profileRef','retentionPolicyRef','validUntilUtc'].sort());
  a(Buffer.byteLength(JSON.stringify(command))<=512);
  // The original native owner-only profile primitive needs NO Premium policy,
  // entitlement, Whop offer, Community owner role or fabricated user grant.
  const Database=require('better-sqlite3');
  const {configurePlatformDatabaseConnection}=require('../../src/modules/platform/server/database/open-platform-database.ts');
  const {verifyPlatformMaintenancePreflightStructure}=require('../../src/modules/platform/server/database/run-platform-migrations.ts');
  const {platformMigrationManifest}=require('../../src/modules/platform/server/database/platform-migration-manifest.ts');
  const {PlatformErasureAdmission}=require('../../src/modules/platform/server/privacy/platform-erasure-admission.ts');
  const {requirePlatformMutationRequest}=require('../../src/modules/platform/server/authentication/platform-mutation-request-security.ts');
  const {requireTraderLinkPlatformAuthenticatedRequestIdentity}=require('../../src/modules/platform/server/authentication/require-platform-request-scope.ts');
  let db=null;
  try{
    const before=fs.lstatSync(input.databasePath,{bigint:true});a(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n);
    a.equal(String(before.dev),state.originalLiveIdentity.device);a.equal(String(before.ino),state.originalLiveIdentity.inode);
    db=new Database(input.databasePath,{fileMustExist:true,timeout:5000});configurePlatformDatabaseConnection(db,'runtime');
    a.equal(platformMigrationManifest.length,211);
    const suffix=platformMigrationManifest[210];
    a.equal(suffix.moduleNamespace,'news');
    a.equal(suffix.migrationId,'0227_news_article_ingestion_memberships');
    a.equal(suffix.executionOrder,306);
    a.equal(verifyPlatformMaintenancePreflightStructure(db,platformMigrationManifest).finalSchemaSha256,targetSchema);
    requirePlatformMutationRequest(input.request);
    const now=()=>new Date();
    const core=PlatformErasureAdmission.bind(db,{nowUtc:()=>now().toISOString(),maximumAdmissionMs:30000,
      profileCatalogSha256:input.profileCatalogSha256,participantStatements:[]});
    const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(input.request.headers,
      {databasePath:input.databasePath,environment:process.env,now});
    a.equal(identity.mode,'platform_session');a(identity.sessionId);
    a.equal(identity.scope.userId,input.expectedGenuineOwnerUserId);
    const after=core.withRequestAuditFrame(input.request,process.env,()=>{
      core.attachRequestPrincipal(identity,()=>a(!input.request.signal.aborted));
      core.requirePlatformOwner();
      rebindProfileSchema(db,command,targetSchema,now().toISOString());
      const qualified=core.profile(command.profileRef);
      a.equal(qualified.generation,command.expectedGeneration);a.equal(qualified.schema_sha256,targetSchema);
      return qualified;
    });
    return {kind:'GENUINE211_NATIVE_PROFILE_SETUP_RESULT',profileRef:command.profileRef,generation:after.generation,
      schemaSha256:input.schemaSha256,validUntilUtc:after.valid_until_utc,oldCheckpointCopybackForbidden:true,
      normalApplicationQualified:false,meaning:'Profile setup only; ordinary-account config/renewal and actual runtime qualification still required.'};
  }finally{
    db?.close();
    // Canonical withPlatformDatabase/withReadonlyPlatformDatabase own and close
    // their resolver handles in finally. The finite caller must synchronously
    // persist its receipt, then observe/reap any deferred integrity child/FDs;
    // no nonexistent global-close API or foreign native instance is invented.
  }
}

module.exports={runNativeProfileSetup,rebindProfileSchema};
