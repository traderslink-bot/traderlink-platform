'use strict';
// Runs only inside the canonical builder AFTER Next has produced standalone.
// Builds the reviewed operations entries; never constructs a database, creates
// approval/signatures or reads production credentials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),a=require('node:assert/strict');
const {buildSync}=require('esbuild');
const root=process.cwd(),out=path.join(root,'combined210-package');
const source=process.env.RAILWAY_GIT_COMMIT_SHA;
a.match(source||'',/^[a-f0-9]{40}$/u);a.equal(root,'/app');
const schema='9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalogPath='docs/migration/partner-alert-erasure-profile-qualification.json';
const catalog=JSON.parse(fs.readFileSync(path.join(root,catalogPath)));
a.equal(catalog.schemaSha256,schema);a.equal(catalog.reviewStatus,'INDEPENDENTLY_REVIEWED');
a.equal(catalog.independentReview?.status,'accepted');a(Date.parse(catalog.qualificationValidUntilUtc)>Date.now());
a.equal(JSON.parse(fs.readFileSync('node_modules/better-sqlite3/package.json')).version,'12.9.0');
a(!fs.existsSync(out));fs.mkdirSync(out,{mode:0o700});
const rawEntries={
 'server.js':'scripts/platform/combined-210-keeper-20261119.cjs',
 'combined-210-control-20261119.cjs':'scripts/platform/combined-210-control-20261119.cjs',
 'combined-210-copy-protocol-20261119.py':'scripts/platform/combined-210-copy-protocol-20261119.py',
 'combined-210-raw-install-20261119.py':'scripts/platform/combined-210-raw-install-20261119.py',
 'combined210-image-predeploy.cjs':'scripts/platform/combined-210-image-predeploy-20261119.cjs',
 'combined210-resource-collector.py':'scripts/platform/combined-210-resource-collector-20261119.py',
};
const entries={
 'community-selected-delivery.cjs':'scripts/platform/community-selected-delivery-command.cjs',
 'combined210-readonly-verifier.cjs':'scripts/platform/combined-210-readonly-verifier-20261119.cjs',
 'combined210-native-profile-setup.cjs':'scripts/platform/combined-210-native-profile-setup-20261119.cjs',
 'combined210-offline-runner.cjs':'scripts/platform/combined-210-offline-runner-20261119.cjs',
 'combined210-native-verification.cjs':'scripts/platform/combined-210-native-verification-20261119.cjs',
};
const allInputs=new Map();
for(const [destination,relative]of Object.entries(rawEntries)){
 const input=path.join(root,relative);const s=fs.lstatSync(input);a(s.isFile()&&!s.isSymbolicLink());
 const raw=fs.readFileSync(input);fs.writeFileSync(path.join(out,destination),raw,{mode:0o400,flag:'wx'});
 allInputs.set(relative,hash(raw));
}
for(const [destination,entry]of Object.entries(entries)){
 const result=buildSync({absWorkingDir:root,entryPoints:[entry],outfile:path.join(out,destination),bundle:true,
  platform:'node',target:'node24',format:'cjs',metafile:true,conditions:['react-server'],
  external:['better-sqlite3','./combined-210-control-20261119.cjs'],
  alias:{'server-only':require.resolve('next/dist/compiled/server-only/empty.js')},
  define:{'import.meta.url':'__community210_config_url'},
  banner:{js:'const __community210_config_url=require("node:url").pathToFileURL("/app/src/modules/platform/server/database/platform-database-config.ts").href;'},
  logLevel:'warning'});
 for(const relative of Object.keys(result.metafile.inputs)){
  const absolute=path.resolve(root,relative);a(absolute.startsWith(root+path.sep));
  allInputs.set(path.relative(root,absolute),hash(fs.readFileSync(absolute)));
 }
}
const copies=[catalogPath,
 'src/modules/platform/server/membership/platform-premium-authority-repository.ts',
 'src/modules/platform/server/membership/platform-premium-whop-native.ts',
 'src/modules/platform/server/privacy/platform-premium-signer-redaction.ts',
 'src/modules/platform/server/database/platform-database-config.ts'];
for(const relative of copies){const raw=fs.readFileSync(path.join(root,relative)),destination=path.join(out,relative);
 fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});fs.writeFileSync(destination,raw,{mode:0o400,flag:'wx'});
 allInputs.set(relative,hash(raw));}
const provenance={version:1,source,node:process.versions.node,abi:process.versions.modules,
 sourceInputs:[...allInputs].sort(([a],[b])=>a<b?-1:a>b?1:0),
 meaning:'Physical compiler inputs and copied source only; no database/runtime qualification or review minted.'};
fs.writeFileSync(path.join(out,'combined210-build-provenance.json'),JSON.stringify(provenance,null,2)+'\n',{mode:0o400,flag:'wx'});
const installedSourcePins={};
for(const name of [...Object.keys(rawEntries),...Object.keys(entries),'combined210-build-provenance.json',...copies])
 installedSourcePins['/app/'+name]=hash(fs.readFileSync(path.join(out,name)));
const applicationEntrySha256=hash(fs.readFileSync(path.join(root,'.next/standalone/server.js')));
const role={version:1,role:'final210',expectedRuntimeUid:0,expectedRuntimeGid:0,runId:'54b58fe4-4a79-4f1a-9071-2ce69e599cb2',targetCount:210,
 projectId:'49fc9197-07c9-45c7-b528-57d0393c2cca',environmentId:'666e1624-a1eb-4e94-8e16-5ed73ad4b4af',serviceId:'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb',
 databasePath:'/data/traderlink-platform.sqlite',applicationSource:source,schemaSha256:schema,
 applicationEntrySha256,readOnlyVerifierSha256:installedSourcePins['/app/combined210-readonly-verifier.cjs'],installedSourcePins,
 purpose:'Keeper-first final and same immutable artifact forward recovery. Never old-checkpoint copyback after target write admission.'};
const rawRole=JSON.stringify(role,null,2)+'\n';a(Buffer.byteLength(rawRole)<32768);
fs.writeFileSync(path.join(out,'combined210-image-role.json'),rawRole,{mode:0o400,flag:'wx'});
console.log(JSON.stringify({stage:'combined210_operations_packaged',source,sourceInputCount:allInputs.size,
 sourceInputsSha256:hash(Buffer.from(JSON.stringify(provenance.sourceInputs))),roleSha256:hash(Buffer.from(rawRole)),
 installedPinCount:Object.keys(installedSourcePins).length,applicationEntrySha256}));
