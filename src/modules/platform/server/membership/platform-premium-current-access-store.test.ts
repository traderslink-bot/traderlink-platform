// @vitest-environment node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { expect, it } from "vitest";
/** One disposable real-node child owns its cwd/catalog/source copies. Never
 * writes the caller's real catalog or substitutes an admission/store module. */
async function runController(capabilityUnit = false):Promise<void>{
 const core=process.cwd(),combined=process.env.CORE_CURRENT_ACCESS_COMBINED_ROOT??core;
 const directory=mkdtempSync(join(tmpdir(),"premium-current-admitted-"));
 const require=createRequire(import.meta.url);
 const paths=new Set([
  "src/modules/platform/contracts/platform-premium-access.ts",
  ...["platform-premium-authority-repository.ts","platform-premium-current-authority.ts","platform-premium-whop-current-access.ts","platform-premium-current-paid-evidence.ts",
   "platform-premium-current-access-event.ts","platform-premium-eligibility-event.ts","platform-premium-role-current-access-schema.ts","platform-premium-role-repository.ts",
   "platform-premium-role-store.ts","platform-premium-role-reconciliation.ts"].map(file=>"src/modules/platform/server/membership/"+file),
  "src/modules/platform/server/privacy/platform-erasure-admission.ts","src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",
  "src/test/fixtures/premium-current-access-native-controller.ts"]);
 const select=(relative:string)=>["",".ts",".tsx",".js",".json","/index.ts"].map(ext=>relative+ext)
  .map(file=>join(paths.has(file)?core:combined,file)).find(file=>existsSync(file));
 try{
  const result=await build({entryPoints:[join(core,"src/test/fixtures/premium-current-access-native-controller.ts")],bundle:true,platform:"node",format:"cjs",target:"node22",write:false,sourcemap:"inline",
   packages:"external",plugins:[{name:"actual-source-with-narrow-Core-slice",setup(plugin){
    plugin.onResolve({filter:/.*/},args=>{
     if(args.path==="server-only")return{path:require.resolve("next/dist/compiled/server-only/empty.js")};
     let relative:string|undefined;
     if(args.path.startsWith("@/"))relative=args.path.slice(2);
     else if(args.path.startsWith(".")){const absolute=resolve(args.resolveDir,args.path);relative=absolute.startsWith(core+"/")?absolute.slice(core.length+1):absolute.startsWith(combined+"/")?absolute.slice(combined.length+1):undefined;}
     if(capabilityUnit&&relative?.replace(/\.ts$/,"")==="src/modules/communities/server/community-staging-qa-target")return{path:"target-unit-only",namespace:"target-unit-only"};
     if(relative?.replace(/\.ts$/,"")==="src/modules/platform/server/database/platform-migration-manifest")return{path:"current-manifest",namespace:"native204"};
     if(relative){const found=select(relative);if(found)return{path:found};}
     return undefined;
    });
    plugin.onLoad({filter:/.*/,namespace:"target-unit-only"},()=>({contents:'export function assertCommunityStagingQaTarget(db,pins){if(!db.open||pins.origin!=="https://synthetic.example.com"||pins.sourceCommit!=="'+"c".repeat(40)+'")throw Error("Synthetic target binding refused");}',loader:"js"}));
    plugin.onLoad({filter:/\.tsx?$/},args=>({contents:readFileSync(args.path,"utf8").replace(/import\.meta\.url/g,JSON.stringify(pathToFileURL(args.path).href)),loader:args.path.endsWith(".tsx")?"tsx":"ts",resolveDir:dirname(args.path)}));
    plugin.onLoad({filter:/.*/,namespace:"native204"},()=>{
     let source=readFileSync(join(combined,"src/modules/platform/server/database/platform-migration-manifest.ts"),"utf8")
      .replace(/from (["'])(\.[^"']+)\1/g,(_match,q,path)=>"from "+q+combined+"/src/modules/platform/server/database/"+path+q);
     if(!source.includes('migrationId: "0216_platform_premium_current_access_events"')&&!source.includes("migration:platformPremiumCurrentAccessEventsMigration")&&!source.includes("migration: platformPremiumCurrentAccessEventsMigration")){
      const tail='    Object.freeze({sourcePath:"src/modules/communities/server/database/migrations/0215_traderlink_community_stats_attribution.ts",migration:traderLinkCommunityStatsAttributionMigration}),';
      if(!source.includes(tail))throw Error("Expected exact combined203 predecessor");
      source='import {platformPremiumCurrentAccessEventsMigration} from "'+join(core,"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts")+'";\n'+source;
      source=source.replace(tail,tail+'\n    Object.freeze({sourcePath:"src/modules/platform/server/database/migrations/0216_platform_premium_current_access_events.ts",migration:platformPremiumCurrentAccessEventsMigration}),');
     }
     return{contents:source,loader:"ts",resolveDir:combined};
    });
   }}]});
  for(const relative of ["membership/platform-premium-authority-repository.ts","membership/platform-premium-whop-native.ts","privacy/platform-premium-signer-redaction.ts"]){
   const file=join(directory,"src/modules/platform/server",relative);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,readFileSync(select("src/modules/platform/server/"+relative)!),{mode:0o600});
  }
  const filename=join(directory,"controller.cjs");writeFileSync(filename,result.outputFiles[0]!.contents,{mode:0o600});
  const child=spawnSync(process.execPath,["--enable-source-maps",filename,...(capabilityUnit?["--runtime-authority-unit"]:[])],{cwd:directory,encoding:"utf8",timeout:30000,
   env:{...process.env,NODE_ENV:"test",NODE_PATH:join(combined,"node_modules")},maxBuffer:128*1024});
  expect(child.status,child.stderr).toBe(0);
  const receiptLine=child.stdout.split("\n").find(line=>line.startsWith("CORE_CURRENT_ACCESS_RECEIPT "));expect(receiptLine,child.stdout).toBeTruthy();
  const receipt=JSON.parse(receiptLine!.slice("CORE_CURRENT_ACCESS_RECEIPT ".length));
  if(capabilityUnit){expect(receipt).toMatchObject({syntheticOnly:true,targetGuardMocked:true,actualStageQualified:false,actualNormalOwnerFrame:true,
    sandboxPositiveOnlyWithOpaqueToken:true,delayedReader:true,networkRequests:0});expect(receipt.negativeCases).toBeGreaterThanOrEqual(13);return;}
  expect(receipt).toMatchObject({syntheticOnly:true,actualCoreAdmission:true,actualSQLiteStore:true,migrations:204,qualifierNegatives:9,unknownRoundTripsAsNull:true,
   originalTicketPreservedAcrossReopen:true,staleOriginalRefused:true,expiryRefreshNotRemoval:true,legacyFalseDoesNotOverrideCurrent:true,periodHistoryNotInvented:true,networkRequests:0});
 }finally{rmSync(directory,{recursive:true,force:true});}
}
it("uses real Core admission/current native receipts/store across restart, expiry and unknown projection",()=>runController(),40000);
it("binds opaque sandbox authority to real owner/session/Core facts with a UNIT-ONLY namespace guard",()=>runController(true),40000);
