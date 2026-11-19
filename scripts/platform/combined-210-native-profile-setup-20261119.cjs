'use strict';
// Compile as ONE native closure against exact210+Core overlay. No caller-supplied
// database, Core admission, Auth frame or owner-scope object is accepted.
// Import alone performs no database, key, profile, Auth or network operation.
const fs=require('node:fs'),a=require('node:assert/strict');
const control=require('./combined-210-control-20261119.cjs');

function runNativeProfileSetup(input){return control.locked(input.protocolRoot,input.runId,()=>runWithinOwnedControl(input));}
function runWithinOwnedControl(input){
  a(input.request instanceof Request);
  const marker=control.read(input.protocolRoot+'/TARGET_WRITES_ADMITTED.json');
  a.equal(marker.runId,input.runId);a.equal(marker.purpose,'native_setup');
  const state=control.readState(input.protocolRoot,input.runId);a.equal(state.phase,'TARGET_WRITES_ADMITTED');
  a.equal(state.nativeSetupPending,true);
  a.equal(state.targetSource,input.source);a.equal(state.targetSchemaSha256,input.schemaSha256);
  a.equal(process.env.NODE_ENV,'production');a.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,input.databasePath);
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
    a.equal(platformMigrationManifest.length,210);
    a.equal(verifyPlatformMaintenancePreflightStructure(db,platformMigrationManifest).finalSchemaSha256,input.schemaSha256);
    requirePlatformMutationRequest(input.request);
    const now=()=>new Date();
    const core=PlatformErasureAdmission.bind(db,{nowUtc:()=>now().toISOString(),maximumAdmissionMs:30000,
      profileCatalogSha256:input.profileCatalogSha256,participantStatements:[]});
    const resolve=()=>requireTraderLinkPlatformAuthenticatedRequestIdentity(input.request.headers,{databasePath:input.databasePath,environment:process.env,now});
    const identity=resolve();a.equal(identity.mode,'platform_session');a(identity.sessionId);
    a.equal(identity.scope.userId,input.expectedGenuineOwnerUserId);
    const binding=JSON.stringify(identity);
    core.withRequestAuditFrame(input.request,process.env,()=>{
      core.attachRequestPrincipal(identity,()=>{
        a.equal(JSON.stringify(resolve()),binding);a(!input.request.signal.aborted);
      });
      core.requirePlatformOwner(); //real Auth/admin frame, fresh evidence, grant, CAS
      core.installProfile(command); //catalog-backed, expectedGeneration checked
    });
    const after=core.profile(command.profileRef);
    a.equal(after.generation,(command.expectedGeneration??0)+1);a.equal(after.schema_sha256,input.schemaSha256);
    return {kind:'GENUINE210_NATIVE_PROFILE_SETUP_RESULT',profileRef:command.profileRef,generation:after.generation,
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

module.exports={runNativeProfileSetup};
