'use strict';
// One exact compiled native closure. Signature validation is performed by the
// canonical real worker bootstrap AFTER the irreversible write barrier. Keeper
// admission rechecks its private pinned receipt using genuinely readonly SQLite.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('./combined-210-control-20261119.cjs'),v=require('./combined-210-native-verification-20261119.cjs');
const KEYS=['PARTNER_ALERT_STRIPE_ERASURE_ENABLED','PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY',
  'PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY','PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY',
  'PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH','PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256',
  'PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH','PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF',
  'PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF','PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY',
  'PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY','PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH'];
function configurationFingerprint(){return v.sha(JSON.stringify(KEYS.map(k=>{a(typeof process.env[k]==='string'&&process.env[k].length);return [k,v.sha(process.env[k])];})));}
function artifact(file,maximum=1024*1024){const s=v.noLinks(file);a(s.size>0&&s.size<=BigInt(maximum));const raw=fs.readFileSync(file);a.equal(BigInt(raw.length),s.size);return {raw,sha256:v.sha(raw)};}
function catalog(expected){a.match(expected,/^[a-f0-9]{64}$/);const file=path.resolve(process.cwd(),'docs/migration/partner-alert-erasure-profile-qualification.json');
  const data=artifact(file);a.equal(data.sha256,expected);const value=JSON.parse(data.raw);
  const {platformPremiumAuthoritySchemaDescriptorV2}=require('../../src/modules/platform/server/membership/platform-premium-authority-repository.ts');
  const {platformPremiumSignerRedactionSchemaDescriptor}=require('../../src/modules/platform/server/privacy/platform-premium-signer-redaction.ts');
  for(const [rel,pin]of Object.entries({'membership/platform-premium-authority-repository.ts':'9a930d63894503c3e909b52e8ba475a1305341a6b85e77007b36f918385631de',
    'membership/platform-premium-whop-native.ts':'0c6e1ad9b402e5bde926284865c38de1f7a7502dcf72c623d6300b8b85637718',
    'privacy/platform-premium-signer-redaction.ts':'364aa7982a87f4cee623dbcc1d50b3c53a94825a1c964278de18c1481bdc9f76'}))
    a.equal(artifact(path.resolve(process.cwd(),'src/modules/platform/server',rel),256*1024).sha256,pin);
  const reviewed=require('../../src/modules/platform/server/privacy/platform-reviewed-erasure-catalog.ts').readReviewedPlatformErasureCatalog(value,{
    nowUtc:new Date().toISOString(),authoritySchemaSha256:platformPremiumAuthoritySchemaDescriptorV2.sha256,
    privacySchemaSha256:platformPremiumSignerRedactionSchemaDescriptor.sha256,nativeSourceArtifactSha256:'364aa7982a87f4cee623dbcc1d50b3c53a94825a1c964278de18c1481bdc9f76'});
  return {value,reviewed};}
function signedArtifactPins(){return {reviewSha256:artifact(process.env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH,32768).sha256,
  backupSha256:artifact(process.env.PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH,32768).sha256};}
function qualifyRuntimePolicyAfterSetup(input){return c.locked(input.root,input.runId,()=>{
  const state=c.readState(input.root,input.runId),marker=c.read(input.root+'/TARGET_WRITES_ADMITTED.json');
  a.equal(state.phase,'TARGET_WRITES_ADMITTED');a.equal(marker.runId,input.runId);
  a.equal(state.targetSource,input.source);a.equal(state.targetSchemaSha256,input.schemaSha256);
  a.equal(process.env.NODE_ENV,'production');a.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,input.databasePath);
  a.equal(process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256,input.profileCatalogSha256);
  const config=configurationFingerprint(),pins=signedArtifactPins(),cat=catalog(input.profileCatalogSha256);
  const id=v.identity(input.databasePath);a.equal(id.device,state.originalLiveIdentity.device);a.equal(id.inode,state.originalLiveIdentity.inode);
  const db=v.open(input.databasePath,false);try{
    db.pragma('query_only=ON'); //real writable handle; canonical reader sees truth, SQL cannot mutate
    const {bootstrapStripeErasureWorker}=require('../../src/modules/platform/server/privacy/platform-stripe-erasure-worker-bootstrap.ts');
    const {currentPlatformErasureAdmission}=require('../../src/modules/platform/server/privacy/platform-erasure-admission.ts');
    a.equal(typeof bootstrapStripeErasureWorker(db),'function');
    const core=currentPlatformErasureAdmission(db);a(core);const profile=core.profile(input.profileRef);
    a.equal(profile.generation,input.profileGeneration);a.equal(profile.schema_sha256,input.schemaSha256);
    a.equal(cat.reviewed.schemaSha256,input.schemaSha256);
    const ledger=v.api().readAppliedPlatformMigrations(db);
    const release=JSON.parse(artifact(process.env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH,32768).raw).fields;
    const backup=JSON.parse(artifact(process.env.PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH,32768).raw).fields;
    a.equal(release[0],'traderlink:paid-stripe-erasure-release:v5');a.equal(release[1],'live');
    a.equal(release[23],input.profileRef);a.equal(release[24],'no_discord_effects');
    // Both signed inventory versions keep independent qualification expiry at6.
    const until=[release[15],backup[6],cat.value.qualificationValidUntilUtc,profile.valid_until_utc].sort()[0];
    a(Number.isFinite(Date.parse(until))&&Date.parse(until)>Date.now());
    a.equal(configurationFingerprint(),config);a.deepEqual(signedArtifactPins(),pins);
    const receipt={kind:'ACTUAL210_POST_BARRIER_CANONICAL_RUNTIME_QUALIFICATION',version:1,runId:input.runId,source:input.source,
      schemaSha256:input.schemaSha256,profileCatalogSha256:input.profileCatalogSha256,profileRef:input.profileRef,
      profileGeneration:input.profileGeneration,appliedLedgerSha256:v.sha(JSON.stringify(ledger)),configurationFingerprint:config,
      ...pins,validUntilUtc:until,atUtc:new Date().toISOString(),canonicalWorkerBootstrapAndProfileVerified:true,
      effectMode:'no_discord_effects',queryOnlySqlEnforced:true,oldCheckpointCopybackForbidden:true};
    c.write(input.root,input.receiptName,receipt);return {receipt,sha256:v.sha(fs.readFileSync(path.join(input.root,input.receiptName)))};
  }finally{db.close();}
});}
function verifyRuntimePolicyArtifacts(input){a(input.qualificationReceipt);const {path:receiptPath,sha256}=input.qualificationReceipt;
  const data=artifact(receiptPath,32768),s=fs.lstatSync(receiptPath);a.equal(s.uid,process.getuid());a.equal(s.mode&0o777,0o600);a.equal(data.sha256,sha256);
  const proof=JSON.parse(data.raw);a.equal(proof.kind,'ACTUAL210_POST_BARRIER_CANONICAL_RUNTIME_QUALIFICATION');
  a.equal(proof.canonicalWorkerBootstrapAndProfileVerified,true);a.equal(proof.effectMode,'no_discord_effects');
  a.equal(proof.schemaSha256,input.schemaSha256);a.equal(proof.profileCatalogSha256,input.profileCatalogSha256);
  a.equal(proof.profileRef,input.profileRef);a.equal(proof.profileGeneration,input.profileGeneration);
  a.equal(proof.configurationFingerprint,configurationFingerprint());a.deepEqual(signedArtifactPins(),{reviewSha256:proof.reviewSha256,backupSha256:proof.backupSha256});
  a(Number.isFinite(Date.parse(proof.atUtc))&&Date.parse(proof.atUtc)<=Date.now());a(Date.parse(proof.validUntilUtc)>Date.now());
  a.equal(process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256,input.profileCatalogSha256);
  const cat=catalog(input.profileCatalogSha256);a.equal(cat.reviewed.schemaSha256,input.schemaSha256);
  const db=v.open(input.databasePath,true);try{
    a.equal(v.sha(JSON.stringify(v.api().readAppliedPlatformMigrations(db))),proof.appliedLedgerSha256);
    const row=db.prepare('SELECT * FROM platform_erasure_profiles WHERE profile_ref=?').get(input.profileRef);
    const profile=cat.reviewed.profiles.find(p=>p.profileRef===input.profileRef);a(row&&profile);
    a.equal(row.generation,input.profileGeneration);a.equal(row.schema_sha256,input.schemaSha256);
    a.equal(row.retention_policy_ref,profile.retentionPolicyRef);a.equal(row.backup_policy_ref,profile.backupPolicyRef);
    a.equal(row.reference_policy,'hold_signer_and_shared_owner');a(row.valid_until_utc>new Date().toISOString()&&row.valid_until_utc<=profile.validUntilUtc);
    return {qualified:true,source:proof.source,runId:proof.runId,profileRef:input.profileRef,profileGeneration:input.profileGeneration};
  }finally{db.close();}}
module.exports={verifyStructure:v.verifyStructure,verifyRuntimePolicyArtifacts,qualifyRuntimePolicyAfterSetup};
