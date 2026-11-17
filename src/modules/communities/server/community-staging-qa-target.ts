import "server-only";
import {createHash} from "node:crypto";
import {readFileSync,realpathSync} from "node:fs";
import type Database from "better-sqlite3";
import {resolvePlatformBackgroundWorkerMode} from "../../platform/server/runtime/platform-background-worker-mode";
import {calculatePlatformSchemaDigest} from "../../platform/server/database/platform-schema-digest";
export const COMMUNITY_STAGING_QA_DATABASE="/data/community-combined-review-20261117/platform.sqlite";
export const COMMUNITY_STAGING_QA_ARTIFACT="/app/isolated-staging-artifact.json";
const DATABASE=COMMUNITY_STAGING_QA_DATABASE,ARTIFACT=COMMUNITY_STAGING_QA_ARTIFACT;
const hash=(value:Buffer)=>createHash("sha256").update(value).digest("hex");
const digest=(value:unknown):value is string=>typeof value==="string"&&/^[0-9a-f]{64}$/.test(value);
function refused():never{throw new Error("Community staging QA target refused.");}
export type CommunityStagingQaTargetPins=Readonly<{origin:string;sourceCommit:string;sourceVectorSha256:string;schemaSha256:string;buildId:string;artifactSha256:string}>;
/** Target qualification ONLY. Grants no QA, billing, role, provider or user authority. */
export function assertCommunityStagingQaTarget(database:Database.Database,pins:CommunityStagingQaTargetPins):void{
 const environment=process.env;
 if(process.getuid?.()!==1001||resolvePlatformBackgroundWorkerMode(environment)!=="disabled_isolated_staging"||environment.TRADERLINK_PLATFORM_DB_PATH!==DATABASE||environment.TRADERLINK_PLATFORM_PUBLIC_ORIGIN!==pins.origin||database.name!==DATABASE||realpathSync(database.name)!==DATABASE||!database.open)refused();
 const bytes=readFileSync(ARTIFACT),artifact=JSON.parse(bytes.toString("utf8"));
 if(!digest(pins.artifactSha256)||hash(bytes)!==pins.artifactSha256||environment.TRADERLINK_PLATFORM_ISOLATED_STAGING_ARTIFACT_SHA256!==pins.artifactSha256||calculatePlatformSchemaDigest(database)!==pins.schemaSha256||artifact.databasePath!==DATABASE||artifact.role!=="community-combined-review")refused();
 for(const key of ["sourceCommit","sourceVectorSha256","schemaSha256","buildId"]as const)if(artifact[key]!==pins[key])refused();
}
