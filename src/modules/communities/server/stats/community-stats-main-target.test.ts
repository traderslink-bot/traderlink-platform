import {randomUUID} from "node:crypto";
import {describe,expect,it} from "vitest";
import {assertCommunityStatsQaBounds} from "./community-stats-staging-qa-controller";
import type {CommunityStagingQaRun} from "../community-staging-qa-capability";

function run(guildId:string,channelIds:string[]):CommunityStagingQaRun{return {kind:"community-staging-qa-run-v1",runId:randomUUID(),nonce:"a".repeat(32),principalManifestSha256:"b".repeat(64),pins:{origin:"https://example.test",sourceCommit:"c".repeat(40),sourceVectorSha256:"d".repeat(64),sourceArchiveSha256:"e".repeat(64),schemaSha256:"f".repeat(64),buildId:"build",artifactSha256:"1".repeat(64)},communityId:randomUUID(),guildId,channelIds,settingsVersion:1,pipeline:"stats",cutoffUtc:new Date().toISOString(),jobs:[],bounds:{durationMs:1000,requests:1,writes:0,gatewayFrames:0,historyTicks:0,collectorTicks:0}};}

describe("Stats exact Main target bounds",()=>{
 it("admits only the owner-designated Main test channels",()=>{expect(()=>assertCommunityStatsQaBounds(run("1433570740430573642",["1546033958448529508","1546034056725008385","1546033844468187156"]))).not.toThrow();});
 it("refuses an ordinary Main channel",()=>{expect(()=>assertCommunityStatsQaBounds(run("1433570740430573642",["1546033958448529999"]))).toThrow("Private Stats test unavailable.");});
 it("preserves the Tests sealed-channel scope",()=>{expect(()=>assertCommunityStatsQaBounds(run("1559172784813514803",["1559172786176401410"]))).not.toThrow();});
});
