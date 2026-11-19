import "server-only";
import {createHash} from "node:crypto";
import {constants,closeSync,existsSync,fstatSync,lstatSync,openSync,readFileSync,realpathSync} from "node:fs";
import {dirname,parse} from "node:path";
import type {NextRequest} from "next/server";
import {resolvePlatformPublicOrigin} from "../../platform/server/authentication/platform-public-origin";
import {openPlatformDatabase} from "../../platform/server/database/open-platform-database";
import {resolvePlatformBackgroundWorkerMode} from "../../platform/server/runtime/platform-background-worker-mode";
import {issueCommunityStagingQaCapability,type CommunityStagingQaRun} from "./community-staging-qa-capability";
import {runFiniteCommunityStagingQa} from "./community-staging-qa-runner";
import {COMMUNITY_STAGING_QA_DATABASE} from "./community-staging-qa-target";

const DIRECTORY="/data/community-combined-review-20261117/delivery-qa";
const FILES={binding:`${DIRECTORY}/binding.json`,run:`${DIRECTORY}/run.json`,principals:`${DIRECTORY}/principals.json`,lineage:`${DIRECTORY}/lineage.json`} as const;
const sha=(value:Buffer)=>createHash("sha256").update(value).digest("hex");
const digest=(value:unknown):value is string=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
let busy=false;
function refused():never{throw new Error("Private Community delivery test unavailable.");}
function early(){if(process.getuid?.()!==1001||resolvePlatformBackgroundWorkerMode(process.env)!=="disabled_isolated_staging"||process.env.TRADERLINK_PLATFORM_DB_PATH!==COMMUNITY_STAGING_QA_DATABASE)refused();}
function readPrivate(path:string):Buffer{
 early();if(!existsSync(path)||realpathSync(path)!==path)refused();
 for(let parent=dirname(path);;parent=dirname(parent)){const stat=lstatSync(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(parent)!==parent||(stat.mode&0o022)!==0||![0,1001].includes(stat.uid))refused();if(parent===parse(parent).root)break;}
 const before=lstatSync(path);if(!before.isFile()||before.isSymbolicLink()||before.uid!==1001||before.nlink!==1||(before.mode&0o777)!==0o600||before.size<1||before.size>65536)refused();
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const opened=fstatSync(fd);if(opened.dev!==before.dev||opened.ino!==before.ino||opened.mode!==before.mode||opened.uid!==before.uid||opened.nlink!==1||opened.size!==before.size)refused();const bytes=readFileSync(fd),after=fstatSync(fd);if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs||bytes.length!==opened.size)refused();return bytes;}finally{closeSync(fd);}
}

/** Fixed-path, one-shot native delivery controller. Importing this module starts nothing. */
export async function startCommunityDeliveryQa(request:NextRequest,nonce:string):Promise<Response>{
 early();const path=`/__private/community-delivery-qa/${nonce}`;
 if(busy||request.method!=="POST"||request.signal.aborted||!/^[a-f0-9]{32}$/.test(nonce)||request.nextUrl.pathname!==path||request.nextUrl.search||request.nextUrl.hash)refused();
 busy=true;let database:ReturnType<typeof openPlatformDatabase>|undefined,capability:ReturnType<typeof issueCommunityStagingQaCapability>|undefined;
 try{
  const binding=JSON.parse(readPrivate(FILES.binding).toString("utf8")) as {kind:string;runManifestSha256:string;principalManifestSha256:string;schemaLineageSha256?:string};
  if(binding.kind!=="community-delivery-qa-binding-v1"||!digest(binding.runManifestSha256)||!digest(binding.principalManifestSha256)||(binding.schemaLineageSha256!==undefined&&!digest(binding.schemaLineageSha256))||Object.keys(binding).some(key=>!["kind","runManifestSha256","principalManifestSha256","schemaLineageSha256"].includes(key)))refused();
  const bytes=readPrivate(FILES.run),run=JSON.parse(bytes.toString("utf8")) as CommunityStagingQaRun;
  if(sha(bytes)!==binding.runManifestSha256||run.nonce!==nonce||run.principalManifestSha256!==binding.principalManifestSha256||!["common-delivery","shared-delivery"].includes(run.pipeline))refused();
  const origin=resolvePlatformPublicOrigin(request);if(origin!==run.pins.origin||request.headers.get("origin")!==origin||request.headers.get("sec-fetch-site")==="cross-site")refused();
  const actual=new Request(origin+path,{method:"POST",headers:new Headers(request.headers),signal:request.signal});
  database=openPlatformDatabase({mode:"runtime"});
  capability=issueCommunityStagingQaCapability({database,request:actual,runManifestPath:FILES.run,runManifestSha256:binding.runManifestSha256,principalManifestPath:FILES.principals,principalManifestSha256:binding.principalManifestSha256,sourceArchiveSha256:run.pins.sourceArchiveSha256,...(binding.schemaLineageSha256?{schemaLineagePath:FILES.lineage,schemaLineageSha256:binding.schemaLineageSha256}:{})});
  const result=await runFiniteCommunityStagingQa(database,capability);
  return Response.json({event:"completed",runId:run.runId,pipeline:result.pipeline,completed:result.completed,delivered:result.delivered,failed:result.failed},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch(error){try{capability?.finish("failed");}catch{/* preserve refusal */}throw error;}
 finally{if(database?.open)database.close();busy=false;}
}
