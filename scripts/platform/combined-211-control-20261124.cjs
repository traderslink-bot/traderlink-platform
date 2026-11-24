'use strict';
// No application/SQLite import or I/O until an explicit protocol method is called.
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const MAX=32768;
const nativeTargetContract='news0227_211_v1',targetCount=211;
const leases=new WeakMap();
const startTicks=()=>fs.readFileSync('/proc/self/stat','utf8').split(') ').at(-1).split(' ')[19];
function hold(condition,code){if(!condition)throw Error(code);}
function checkRoot(root){hold(path.isAbsolute(root)&&path.normalize(root)===root,'invalid_protocol_root');let p='/';
  for(const part of root.split('/').filter(Boolean)){p=path.join(p,part);const s=fs.lstatSync(p);hold(s.isDirectory()&&!s.isSymbolicLink(),'protocol_root_alias');}
  const s=fs.statSync(root);hold(s.uid===process.getuid()&&(s.mode&0o777)===0o700,'protocol_root_not_private');}
function syncDir(root){const fd=fs.openSync(root,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function read(file){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const s=fs.fstatSync(fd);hold(s.isFile()&&s.nlink===1&&s.size<=MAX,'protocol_record_identity_or_size');
  const raw=fs.readFileSync(fd);hold(raw.length===s.size,'protocol_record_length');return JSON.parse(raw);}finally{fs.closeSync(fd);}}
function write(root,name,value,replace=false){hold(!name.includes('/')&&!['','.','..'].includes(name),'protocol_record_name');const raw=Buffer.from(JSON.stringify(value)+'\n');hold(raw.length<=MAX,'protocol_record_bound');
  const file=path.join(root,replace?name+'.next-'+randomUUID():name);const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(replace)fs.renameSync(file,path.join(root,name));syncDir(root);}
function assertLease(lease,root,runId){const live=leases.get(lease);hold(live?.active&&live.root===root&&live.runId===runId,'protocol_lease_not_live');
  checkRoot(root);const st=fs.lstatSync(live.lock,{bigint:true}),owner=read(path.join(live.lock,'owner.json'));
  hold(st.isDirectory()&&!st.isSymbolicLink()&&st.dev===live.device&&st.ino===live.inode
    &&owner.token===live.token&&owner.runId===runId&&owner.pid===process.pid&&owner.startTicks===startTicks(),'protocol_lock_owner_changed');}
function acquire(root,runId){
  checkRoot(root);const lock=path.join(root,'protocol-lock');fs.mkdirSync(lock,{mode:0o700});const st=fs.lstatSync(lock,{bigint:true}),token=randomUUID();
  write(lock,'owner.json',{token,runId,pid:process.pid,startTicks:startTicks()});syncDir(root);
  const lease=Object.freeze({});leases.set(lease,{active:true,root,runId,lock,token,device:st.dev,inode:st.ino});return lease;}
function release(lease,root,runId){const live=leases.get(lease);try{assertLease(lease,root,runId);fs.unlinkSync(path.join(live.lock,'owner.json'));fs.rmdirSync(live.lock);syncDir(root);}finally{live.active=false;}}
function locked(root,runId,operation){hold(operation.constructor.name!=='AsyncFunction','async_control_operation_forbidden');
  const lease=acquire(root,runId);
  try{const value=operation(lease);hold(!value||typeof value.then!=='function','async_control_result_forbidden');assertLease(lease,root,runId);return value;}
  finally{release(lease,root,runId);}}
async function lockedAsync(root,runId,operation){hold(operation.constructor.name==='AsyncFunction','explicit_async_operation_required');const lease=acquire(root,runId);
  try{const value=await operation(lease);assertLease(lease,root,runId);return value;}finally{release(lease,root,runId);}}
function within(input,operation){if(input.controlLease){assertLease(input.controlLease,input.root,input.runId);return operation(input.controlLease);}
  return locked(input.root,input.runId,operation);}
function readState(root,runId){const value=read(path.join(root,'state.json'));hold(value.version===1&&value.runId===runId,'protocol_state_binding');hold(value.nativeTargetContract===nativeTargetContract&&value.targetCount===targetCount,'exact211_protocol_contract_required');hold(Number.isSafeInteger(value.sequence)&&value.sequence>=0,'protocol_sequence');return value;}
function sameIdentity(a,b){return ['device','inode','uid','bytes'].every(k=>typeof a[k]==='string'&&/^\d+$/.test(a[k])&&a[k]===b[k]);}

function markTargetVerified(input){return within(input,()=>{
  hold(!fs.existsSync(path.join(input.root,'TARGET_WRITES_ADMITTED.json')),'target_writes_already_admitted');
  const old=readState(input.root,input.runId);hold(old.phase==='INSTALL_HASH_VERIFIED','target_not_hash_installed');
  const proof=input.readOnlyVerification;hold(proof.kind==='EXACT211_INSTALLED_READONLY_VERIFICATION'&&proof.nativeTargetContract===nativeTargetContract&&proof.runId===input.runId,'target_verification_binding');
  hold(proof.source===input.source&&proof.schemaSha256===input.schemaSha256&&proof.count===targetCount,'target_source_or_schema');
  hold(sameIdentity(proof.liveIdentity,old.transferResult.liveIdentity),'target_inode_drift');
  hold(proof.fileSha256===old.offlineTargetSha256&&proof.fileSha256===old.transferResult.sha256,'target_hash_drift');
  hold(proof.fullLedgerOriginalPrefixAndDataPreserved===true&&proof.foreignKeys==='ok'&&proof.quickCheck==='ok','target_verification_incomplete');
  hold(proof.applicationOrAuthOrProviderWrites===0,'target_verifier_was_not_readonly');
  hold(/^[a-f0-9]{64}$/.test(input.verificationReceiptSha256),'target_receipt_sha');
  const next={...old,phase:'TARGET_VERIFIED',sequence:old.sequence+1,verificationReceiptSha256:input.verificationReceiptSha256,
    targetSource:input.source,targetSchemaSha256:input.schemaSha256};write(input.root,'state.json',next,true);return next;
});}

function admitTargetWrites(input){return within(input,()=>{
  const old=readState(input.root,input.runId),file=path.join(input.root,'TARGET_WRITES_ADMITTED.json');
  hold(input.actualRuntimeOrdinaryAccountAndCatalogQualified===true,'ordinary_account_and_catalog_unqualified');
  // A restart can reuse the SAME durable admitted target. It never reopens the
  // old-checkpoint rollback path. A different forward image needs Root review.
  if(fs.existsSync(file)){const marker=read(file);hold(marker.runId===input.runId&&marker.targetSource===input.source&&marker.targetSchemaSha256===input.schemaSha256
      &&marker.imageDigest===input.imageDigest&&marker.admissionReceiptSha256===input.admissionReceiptSha256,'different_target_write_admission');
    hold(marker.purpose!=='native_setup'&&!old.nativeSetupPending,'native_setup_requires_qualified_transition');
    hold(['TARGET_VERIFIED','TARGET_WRITES_ADMITTED'].includes(old.phase),'write_admission_state_conflict');
    if(old.phase!=='TARGET_WRITES_ADMITTED')write(input.root,'state.json',{...old,phase:'TARGET_WRITES_ADMITTED',sequence:old.sequence+1},true);return marker;}
  hold(old.phase==='TARGET_VERIFIED'&&old.targetSource===input.source&&old.targetSchemaSha256===input.schemaSha256,'target_not_verified');
  hold(/^[a-f0-9]{64}$/.test(input.admissionReceiptSha256)&&/^sha256:[a-f0-9]{64}$/.test(input.imageDigest),'write_admission_proof_identity');
  hold(input.actualRuntimeOrdinaryAccountAndCatalogQualified===true,'ordinary_account_and_catalog_unqualified');
  const marker={version:1,runId:input.runId,targetSource:input.source,targetSchemaSha256:input.schemaSha256,imageDigest:input.imageDigest,
    admissionReceiptSha256:input.admissionReceiptSha256,verificationReceiptSha256:old.verificationReceiptSha256,
    atUtc:new Date().toISOString(),meaning:'Every old-checkpoint copyback is forbidden after this durable point, including before first human traffic.'};
  write(input.root,'TARGET_WRITES_ADMITTED.json',marker); //fsync FILE+DIR BEFORE app import
  write(input.root,'state.json',{...old,phase:'TARGET_WRITES_ADMITTED',sequence:old.sequence+1},true);return marker;
});}

function admitNativeSetupWrites(input){return within(input,()=>{
  const old=readState(input.root,input.runId);
  hold(old.phase==='TARGET_VERIFIED'&&old.targetSource===input.source&&old.targetSchemaSha256===input.schemaSha256,'setup_target_not_verified');
  hold(input.actualSignedConfigurationAndCatalogQualified===true&&input.genuineOwnerSessionCustodyConfirmed===true,'native_setup_not_qualified');
  hold(/^sha256:[a-f0-9]{64}$/.test(input.imageDigest)&&/^[a-f0-9]{64}$/.test(input.admissionReceiptSha256),'native_setup_receipt_identity');
  const marker={version:1,runId:input.runId,targetSource:input.source,targetSchemaSha256:input.schemaSha256,imageDigest:input.imageDigest,
    admissionReceiptSha256:input.admissionReceiptSha256,verificationReceiptSha256:old.verificationReceiptSha256,purpose:'native_setup',
    atUtc:new Date().toISOString(),meaning:'Before ANY Auth/profile write; normal application remains HOLD. Original checkpoint copyback permanently forbidden.'};
  write(input.root,'TARGET_WRITES_ADMITTED.json',marker);
  write(input.root,'state.json',{...old,phase:'TARGET_WRITES_ADMITTED',sequence:old.sequence+1,nativeSetupPending:true},true);return marker;
});}

function admitForwardTargetWrites(input){return within(input,()=>{
  const old=readState(input.root,input.runId),marker=read(path.join(input.root,'TARGET_WRITES_ADMITTED.json'));
  hold(old.phase==='TARGET_WRITES_ADMITTED'&&marker.runId===input.runId,'target_writes_not_admitted');
  hold(input.schemaSha256===marker.targetSchemaSha256,'forward_recovery_schema_changed');
  hold(input.actualRuntimeOrdinaryAccountAndCatalogQualified===true&&input.current211ReadOnlyStructureVerified===true&&input.nativeTargetContract===nativeTargetContract,'forward_recovery_not_qualified');
  hold(/^[a-f0-9]{64}$/.test(input.admissionReceiptSha256),'forward_recovery_receipt');
  const qualified=old.qualifiedRecoveryImages?.find(x=>x.source===input.source&&x.schemaSha256===input.schemaSha256&&x.imageDigest===input.imageDigest);
  hold(qualified&&/^[a-f0-9]{64}$/.test(qualified.installedImageReviewSha256),'forward_image_not_in_reviewed_allowlist');
  const name='forward-image-'+input.imageDigest.replace('sha256:','')+'.json';
  const proof={version:1,runId:input.runId,source:input.source,schemaSha256:input.schemaSha256,imageDigest:input.imageDigest,
    admissionReceiptSha256:input.admissionReceiptSha256,installedImageReviewSha256:qualified.installedImageReviewSha256,
    originalWriteAdmission:marker.admissionReceiptSha256,oldCheckpointCopybackStillForbidden:true};
  if(fs.existsSync(path.join(input.root,name))){const existing=read(path.join(input.root,name));hold(JSON.stringify(existing)===JSON.stringify(proof),'forward_admission_conflict');}
  else write(input.root,name,proof);
  // Preserve the FIRST irreversible write marker. A genuinely qualified later
  // receipt permits the SAME image to leave native setup, or a reviewed forward
  // image to recover, without pretending either receipt was the setup receipt.
  write(input.root,'state.json',{...old,sequence:old.sequence+1,nativeSetupPending:false,
    activeRuntimeAdmission:{imageDigest:input.imageDigest,source:input.source,admissionReceiptSha256:input.admissionReceiptSha256}},true);
  return proof;
});}

module.exports={nativeTargetContract,targetCount,checkRoot,read,write,locked,lockedAsync,assertLease,readState,markTargetVerified,admitTargetWrites,admitNativeSetupWrites,admitForwardTargetWrites,sameIdentity};
