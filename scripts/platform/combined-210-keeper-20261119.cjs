'use strict';
// Versioned image entry keeper. Maintenance and partial-file recovery NEVER open
// SQLite. Normal roles boot into HOLD first so real provider image metadata can
// be observed before explicit native/application admission, avoiding a boot loop.
const fs=require('node:fs'),http=require('node:http'),crypto=require('node:crypto');
const control=require('./combined-210-control-20261119.cjs');
const PHASES=new Set(['MAINTENANCE_HOLD','PREPARING_BACKUP','OFFLINE_MIGRATING','OFFLINE_TARGET_VERIFIED','INSTALLING','INSTALL_FAILED','INSTALL_HASH_VERIFIED','TARGET_VERIFIED','TARGET_WRITES_ADMITTED',
  'COPYBACK_IN_PROGRESS','COPYBACK_FAILED','ORIGINAL_HASH_VERIFIED','ORIGINAL_VERIFIED']);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');

function maintenanceHandler(input){return (req,res)=>{
  let phase='UNKNOWN_REQUIRES_INSPECTION';
  try{control.checkRoot(input.root);const state=control.readState(input.root,input.runId);if(PHASES.has(state.phase))phase=state.phase;}catch{}
  if(req.method==='GET'&&req.url==='/api/platform/health'){
    // HTTP200 allows the keeper to remain reachable after an interrupted file
    // transfer. status is explicitly NOT application readiness/schema evidence.
    res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
    res.end(JSON.stringify({status:'maintenance_hold',role:input.role,phase,databaseOpened:false,applicationStarted:false,
      pid:process.pid,deployment:input.deployment}));
  }else{res.writeHead(503,{'content-type':'application/json','cache-control':'no-store'});res.end('{"status":"maintenance"}');}
};}

function checkFile(file,expected){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const s=fs.fstatSync(fd);
  if(!s.isFile()||s.nlink!==1||digest(fs.readFileSync(fd))!==expected)throw Error('installed_source_pin_mismatch');
}finally{fs.closeSync(fd);}}

// Capture exactly the bounded private bytes later parsed AND hashed.
function readActivationRaw(root,file){
  control.checkRoot(root);
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try{
    const before=fs.fstatSync(fd,{bigint:true});
    if(!before.isFile()||before.nlink!==1n||before.uid!==BigInt(process.getuid())
      ||(before.mode&0o777n)!==0o600n||before.size<1n||before.size>32768n)throw Error('activation_record_identity');
    const raw=fs.readFileSync(fd),after=fs.fstatSync(fd,{bigint:true});
    for(const key of ['dev','ino','size','nlink','uid','mode','mtimeNs','ctimeNs'])if(before[key]!==after[key])throw Error('activation_record_changed');
    if(BigInt(raw.length)!==before.size)throw Error('activation_record_length');
    return raw;
  }finally{fs.closeSync(fd);}
}

// A private source-bound receipt, never a native success/admission assertion.
function recordTerminalKeeper({root,role,deployment,activationSha256,applicationImportAttempted}){
  if(applicationImportAttempted||!/^[a-f0-9]{64}$/.test(activationSha256||''))return;
  control.checkRoot(root);
  const startTicks=fs.readFileSync('/proc/self/stat','utf8').split(') ').at(-1).split(' ')[19];
  const instanceId=process.env.RAILWAY_REPLICA_ID||process.env.RAILWAY_INSTANCE_ID;
  if(!/^[a-f0-9-]{36}$/.test(deployment)||!/^[a-f0-9-]{36}$/.test(instanceId||'')||!/^[0-9]+$/.test(startTicks))throw Error('terminal_receipt_identity');
  const name='keeper-terminal-'+deployment+'-'+process.pid+'-'+startTicks+'.json';
  control.write(root,name,{kind:'ROOT_INSTALLED_KEEPER_ACTIVATION_TERMINAL_V1',version:1,
    runId:role.runId,source:role.applicationSource,schemaSha256:role.schemaSha256,
    deployment,instanceId,pid:process.pid,startTicks,
    keeperSha256:digest(fs.readFileSync(__filename)),
    imageRoleSha256:digest(fs.readFileSync('/app/combined210-image-role.json')),
    controlSha256:role.installedSourcePins['/app/combined-210-control-20261119.cjs'],
    activationSha256,timerCleared:true,applicationImportAttempted:false,
    nativeSuccessAsserted:false,recoveryAuthorized:false,atUtc:new Date().toISOString()});
}

async function main(){
  const role=control.read('/app/combined210-image-role.json');
  if(!['maintenance211','transitional211','final211','recovery211'].includes(role.role))throw Error('unknown210image_role');
  for(const [name,value]of Object.entries({RAILWAY_PROJECT_ID:role.projectId,RAILWAY_ENVIRONMENT_ID:role.environmentId,
    RAILWAY_SERVICE_ID:role.serviceId,TRADERLINK_PLATFORM_DB_PATH:role.databasePath}))if(process.env[name]!==value)throw Error('wrong210target');
  const deployment=process.env.RAILWAY_DEPLOYMENT_ID;
  if(!/^[a-f0-9-]{36}$/.test(deployment||'')||role.targetCount!==control.targetCount||role.nativeTargetContract!==control.nativeTargetContract||!/^[a-f0-9]{40}$/.test(role.applicationSource)
    ||!/^[a-f0-9]{64}$/.test(role.schemaSha256))throw Error('unbound210image');
  const root=process.env.TRADERLINK_210_PROTOCOL_ROOT;
  // The protocol directory/state can be absent, corrupt, or left by a partial
  // transfer. Immutable image/target checks still hold; HTTP HOLD starts without
  // consulting SQLite or requiring a readable mutable protocol record.
  if(typeof root!=='string'||!root.startsWith('/')||require('node:path').normalize(root)!==root)throw Error('invalid210protocol_root');
  for(const [file,sha256]of Object.entries(role.installedSourcePins||{}))checkFile(file,sha256);
  const server=http.createServer(maintenanceHandler({root,runId:role.runId,role:role.role,deployment}));
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(Number(process.env.PORT||3000),'0.0.0.0',resolve);});
  if(role.role==='maintenance211')return; //no activation/application path exists
  const activationPath=root+'/activate-runtime.json';let activating=false;
  const timer=setInterval(async()=>{
    if(activating||!fs.existsSync(activationPath))return;
    activating=true;let activationSha256=null,applicationImportAttempted=false;
    try{
      const activationRaw=readActivationRaw(root,activationPath);activationSha256=digest(activationRaw);
      const activation=JSON.parse(activationRaw);
      if(activation.kind!=='ROOT_REVIEWED211_RUNTIME_ACTIVATION'||activation.deployment!==deployment
        ||activation.source!==role.applicationSource||activation.schemaSha256!==role.schemaSha256
        ||!/^sha256:[a-f0-9]{64}$/.test(activation.imageDigest)||!/^[a-f0-9]{64}$/.test(activation.admissionReceiptSha256)
        ||!Number.isFinite(Date.parse(activation.validUntilUtc))||Date.parse(activation.validUntilUtc)<=Date.now())throw Error('activation_binding');
      // This is a private Root-owned operating artifact, never a request flag.
      // Source-prep emits no positive activation or production trust material.
      if(activation.actualRuntimeOrdinaryAccountAndCatalogQualified!==true)throw Error('runtime_account_not_qualified');
      activateVerifiedTarget({root,role,activation},()=>{
        checkFile('/app/combined210-readonly-verifier.cjs',role.readOnlyVerifierSha256);
        return require('/app/combined210-readonly-verifier.cjs');
      });
      // Durable write milestone is fsynced before stopping keeper or importing
      // ANY normal application/Auth/provider/worker code.
      clearInterval(timer);
      await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
      checkFile('/app/application-server.js',role.applicationEntrySha256);
      applicationImportAttempted=true;require('/app/application-server.js');
    }catch{
      // Never reopen rollback or expose raw paths/keys/SQL errors. Keep HOLD if
      // app was not loaded; after the milestone only compatible210 recovery.
      activating=false;clearInterval(timer); //one request, no blind retry
      try{recordTerminalKeeper({root,role,deployment,activationSha256,applicationImportAttempted});}catch{}
      process.stderr.write('combined210_activation_hold\n');
      if(!server.listening)process.exitCode=1;
    }
  },1000);
}

function activateVerifiedTarget({root,role,activation},loadVerifier){
  return control.locked(root,role.runId,controlLease=>{
    const state=control.readState(root,role.runId);
    if(!['TARGET_VERIFIED','TARGET_WRITES_ADMITTED'].includes(state.phase)
      ||state.targetSource!==role.applicationSource||state.targetSchemaSha256!==role.schemaSha256)throw Error('target_not_safe_for_verifier');
    // This lock spans phase check, verifier construction/SQL, and write barrier.
    // A partial-file state or active Python install/copyback cannot even load it.
    const verifier=loadVerifier();
    const structure=verifier.verifyStructure({databasePath:role.databasePath,expectedSchemaSha256:role.schemaSha256});
    if(structure.count!==211||structure.schemaSha256!==role.schemaSha256)throw Error('current210structure_mismatch');
    const policy=verifier.verifyRuntimePolicyArtifacts({databasePath:role.databasePath,schemaSha256:role.schemaSha256,
      profileCatalogSha256:activation.profileCatalogSha256,profileRef:activation.erasureProfileRef,
      profileGeneration:activation.profileGeneration,qualificationReceipt:activation.policyQualificationReceipt});
    if(policy.source!==role.applicationSource||policy.runId!==role.runId)throw Error('runtime_policy_wrong_source_or_run');
    control.assertLease(controlLease,root,role.runId);
    const input={root,runId:role.runId,controlLease,source:role.applicationSource,schemaSha256:role.schemaSha256,imageDigest:activation.imageDigest,
      admissionReceiptSha256:activation.admissionReceiptSha256,
      actualRuntimeOrdinaryAccountAndCatalogQualified:activation.actualRuntimeOrdinaryAccountAndCatalogQualified};
    // Every post-write activation, including the SAME image after native setup,
    // needs its own genuine runtime qualification and reviewed image allowlist.
    if(state.phase==='TARGET_WRITES_ADMITTED')return control.admitForwardTargetWrites({...input,current211ReadOnlyStructureVerified:true,nativeTargetContract:control.nativeTargetContract});
    return control.admitTargetWrites(input);
  });
}

if(require.main===module)main().catch(()=>{process.stderr.write('combined210_keeper_boot_hold\n');process.exitCode=1;});
module.exports={maintenanceHandler,checkFile,activateVerifiedTarget,recordTerminalKeeper,readActivationRaw};
