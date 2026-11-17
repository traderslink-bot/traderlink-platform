// @vitest-environment node
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { readAppliedPlatformMigrations } from "../../platform/server/database/platform-migration-registry";

const { requireWriter } = vi.hoisted(() => ({ requireWriter: vi.fn() }));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({ requirePlatformErasureWriter: requireWriter }));
vi.mock("server-only", () => ({}));

import { createPartnerAlertStripeErasureAuthorityReader, type StripeErasureAuthoritySources } from "./partner-alert-stripe-erasure-authority";
import type { StripeErasureRoleFacts, StripeErasureRoleProofScope } from "./partner-alert-stripe-erasure-role-proof";
import {createPartnerAlertStripeErasureDiscordObserver} from "./partner-alert-stripe-erasure-role-proof";

it("confirms a departed Discord member without a role write and holds on an unknown guild", async () => {
  const target = {guildId:"100",discordUserId:"141",roleId:"120"};
  const at = "2026-11-15T12:00:05.000Z";
  let code = 10007;
  const transport:typeof fetch = async (url, init) => {
    expect(init?.method ?? "GET").toBe("GET");
    const path = new URL(String(url)).pathname;
    if (path === "/api/v10/users/@me") return Response.json({id:"900",bot:true});
    expect(path).toBe("/api/v10/guilds/100/members/141");
    return Response.json({code},{status:404});
  };
  const observe = createPartnerAlertStripeErasureDiscordObserver({botUserId:"900",botToken:"synthetic-bot-token-only",
    maximumDurationMs:5000,transport},() => at);
  expect(await observe(target)).toEqual({...target,present:false,observedAtUtc:at});
  code = 10004;
  expect(await observe(target)).toBeNull();
});

it("requires an admitted root and current, independent evidence for both payment sources and transport", () => {
  const db = new Database(":memory:");
  try {
    db.exec(`CREATE TABLE platform_auth_identities(user_id,auth_provider,auth_subject,status);
      INSERT INTO platform_auth_identities VALUES('buyer','discord','741','active');
      CREATE TABLE platform_schema_migrations(migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256,applied_at_utc,sqlite_version);
      INSERT INTO platform_schema_migrations VALUES('0209','platform',247,'checksum','schema','utc','sqlite');`);
    const at = "2026-11-15T12:00:00.000Z";
    const deadline = "2026-11-15T12:01:00.000Z";
    const digest = "a".repeat(64);
    const ledgerDigest = createHash("sha256").update(JSON.stringify(readAppliedPlatformMigrations(db))).digest("hex");
    const facts: StripeErasureRoleFacts = { scope:{community_id:"community",buyer_user_id:"buyer",mapping_id:"mapping"},
      guildId:"100",roleId:"101",stripeAuthoritySha256:digest,whopAuthoritySha256:digest,mappingSha256:digest };
    const scope: Extract<StripeErasureRoleProofScope,{mode:"root"}> = {
      mode:"root",operationRef:"operation",userId:"target",workspaceId:"workspace",lifecycleRef:"lifecycle",
      erasureGeneration:2,schemaSha256:digest,appliedLedgerSha256:ledgerDigest,catalogSha256:digest,writerFenceRef:"fence",writerFenceGeneration:3,
    };
    let currentAt = at;
    let admits = true;
    requireWriter.mockImplementation((database, userId) => {
      expect(database).toBe(db);
      expect(userId).toBeUndefined();
      if (!admits || !db.inTransaction) throw new Error("Not admitted.");
      return { now:() => currentAt,rootCommand:(user:string) => user === "target" ? "operation" : "",
        qualificationReceipt:() => ({schemaSha256:digest,profileCatalogSha256:digest}),
        lifecycle:() => ({phase:"settling",lifecycle_ref:"lifecycle",operation_ref:"operation",profile_ref:"profile",profile_generation:1,
          erasure_generation:2,generation:3,valid_until_utc:deadline}),
        operation:() => ({phase:"ready",quiescence_ref:"fence",workspace_id:"workspace",lifecycle_ref:"lifecycle",
          profile_ref:"profile",profile_generation:1,valid_until_utc:deadline}) };
    });
    let whop: "qualified" | "absent" | "unknown" = "absent";
    let transportDiscord = "741";
    let restoreAuthenticated = false;
    const sources: StripeErasureAuthoritySources = {
      readStripeSurvivor:() => ({kind:"absent",authoritySha256:digest,validUntilUtc:deadline}),
      readWhopSurvivor:() => ({kind:whop,authoritySha256:digest,validUntilUtc:deadline}),
      readSettledTransport:() => ({guildId:"100",roleId:"101",discordUserId:transportDiscord,
        settledTransportSha256:digest,settledAtUtc:at,validUntilUtc:deadline}),
      verifyRestoreAuthority:(_db, expected) => restoreAuthenticated && expected.snapshotSha256 === digest,
    };
    const read = createPartnerAlertStripeErasureAuthorityReader(db,sources);
    const inside = db.transaction((expected: StripeErasureRoleProofScope = scope) => read(expected,facts,at));
    expect(read(scope,facts,at)).toBeNull();
    expect(inside.immediate()).toMatchObject({discordUserId:"741",desiredPresent:false});
    expect(inside.immediate({...scope,catalogSha256:ledgerDigest})).toBeNull();
    expect(inside.immediate({...scope,schemaSha256:ledgerDigest})).toBeNull();
    db.exec("UPDATE platform_schema_migrations SET sqlite_version='changed'");
    expect(inside.immediate()).toBeNull();
    db.exec("UPDATE platform_schema_migrations SET sqlite_version='sqlite'");
    whop = "unknown";
    expect(inside.immediate()).toBeNull();
    whop = "qualified";
    expect(inside.immediate()).toMatchObject({desiredPresent:true});
    expect(inside.immediate({...scope,writerFenceRef:"different"})).toBeNull();
    transportDiscord = "742";
    expect(inside.immediate()).toBeNull();
    transportDiscord = "741";
    const restore: StripeErasureRoleProofScope = { ...scope,mode:"restore",snapshotSha256:digest,tombstoneRef:"tombstone",
      tombstoneLedgerGeneration:1,tombstoneLedgerSha256:digest,restoreKeyringSha256:digest };
    expect(inside.immediate(restore)).toBeNull();
    restoreAuthenticated = true;
    expect(inside.immediate(restore)).toMatchObject({desiredPresent:true});
    expect(inside.immediate({...restore,snapshotSha256:"b".repeat(64)})).toBeNull();
    currentAt = deadline;
    expect(inside.immediate()).toBeNull();
    currentAt = at;
    admits = false;
    expect(inside.immediate()).toBeNull();
  } finally { db.close(); }
});
