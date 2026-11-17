// @vitest-environment node
import { createHmac, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";
import { PartnerAlertWhopInbox, type PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopCommercialApply } from "./partner-alert-whop-commercial-apply";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/partner-whop/route";
import type { PartnerAlertRequestRuntime } from "./partner-alert-request-runtime";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";

import { qualifiedPaidInput, discordUserId, guildId, mappingId, roleId } from "../contracts/partner-alert-access-policy.test-fixture";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { disconnectPartnerAlertWhopConnections, PARTNER_ALERT_REMOVED_CREDENTIAL_JSON } from "./partner-alert-retention-policy";
import { runPartnerAlertLifecycleBatch } from "./partner-alert-lifecycle";
import { PartnerAlertRoleWorker } from "./partner-alert-role-worker";
import { reconcilePartnerAlertStripeRole } from "./partner-alert-stripe-role-reconciliation";
import { createPartnerAlertStripeRolePorts } from "./partner-alert-stripe-role-ports";
import { createPartnerAlertStripeDiscordTestGuild } from "./partner-alert-stripe-discord-test-guild";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";

const { receiveWhopEvent } = vi.hoisted(() => ({ receiveWhopEvent: vi.fn() }));
vi.mock("./partner-alert-request-runtime", () => ({
  withPartnerAlertRequestRuntime: async (_request: NextRequest,
    operation: (runtime: Pick<PartnerAlertRequestRuntime, "receiveWhopEvent">) => Promise<Response>) => operation({ receiveWhopEvent }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  receiveWhopEvent.mockReset();
});

it("the webhook route refuses to accept events without configured authority", async () => {
  vi.stubEnv("PARTNER_ALERT_WHOP_WEBHOOK_ENABLED", "");
  expect((await POST(new NextRequest("http://localhost/api/webhooks/partner-whop", { method: "POST" }))).status).toBe(503);
  expect(receiveWhopEvent).not.toHaveBeenCalled();
});

vi.mock("./partner-alert-admission", () => ({
  requirePartnerAlertAdmission: () => ({
    runCommunity: (_community: string, _users: readonly string[], operation: () => unknown) => operation(),
    assertCommunityFence: () => undefined,
    captureCommunityFence: () => ({}),
    isCurrent: () => true,
  }),
}));

it("atomically wakes the exact affected offer mappings and preserves unrelated jobs", () => {
  const db = new Database(":memory:");
  const communityId = "11111111-1111-4111-8111-111111111111";
  const userId = "22222222-2222-4222-8222-222222222222";
  const now = "2026-11-14T22:00:00.000Z";
  const scope = { communityId, environment: "sandbox", accountId: "biz_fixture",
    apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION } as const;
  const leaseToken = "33333333-3333-4333-8333-333333333333";
  const claim = { leaseToken, attempts: 1, admissionFence: {},
    event: { ...scope, eventId: "evt_refund", eventType: "refund.updated", resourceKind: "payment",
      resourceId: "pay_fixture", payloadSha256: "a".repeat(64), occurredAtUtc: now } } as PartnerAlertWhopInboxClaim;
  try {
    db.exec(`CREATE TABLE partner_alert_whop_inbox(community_id,environment,whop_account_id,event_id,status,
      lease_token,lease_until_utc,payload_sha256,resource_kind,resource_id,admission_fence_json,last_error_code);
      CREATE TABLE partner_alert_role_jobs(community_id,user_id,mapping_id,status,refresh_required,next_attempt_at_utc);
      CREATE TABLE partner_alert_offer_channels(community_id,mapping_id,offer_id,offer_version INTEGER);`);
    db.prepare("INSERT INTO partner_alert_whop_inbox VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL)").run(
      communityId, scope.environment, scope.accountId, claim.event.eventId, "processing", leaseToken,
      "2026-11-14T22:10:00.000Z", claim.event.payloadSha256, claim.event.resourceKind, claim.event.resourceId, "{}");
    for (const [user, mapping, offer, version] of [[userId, "target", "offer", 1],
      [userId, "another-version", "offer", 2], [userId, "another-offer", "other", 1],
      ["other-user", "target", "offer", 1]] as const) {
      db.prepare("INSERT INTO partner_alert_role_jobs VALUES (?,?,?,'applied',0,?)").run(
        communityId, user, mapping, "2026-11-14T23:00:00.000Z");
      db.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,?,?)").run(communityId, mapping, offer, version);
    }
    const preparation = { context: { communityId, userId, offerId: "offer", offerVersion: 1 } } as PartnerAlertWhopPreparation;
    const commercial = { retain: vi.fn() } as unknown as PartnerAlertWhopCommercialApply;
    const inbox = new PartnerAlertWhopInbox(db, { scope, nowUtc: () => now, createLeaseToken: () => leaseToken });
    expect(() => inbox.completePreparedWith(claim, preparation, commercial, () => { throw new Error("write aborted"); })).toThrow();
    expect(db.prepare("SELECT count(*) n FROM partner_alert_role_jobs WHERE refresh_required=1").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT status FROM partner_alert_whop_inbox").get()).toEqual({ status: "processing" });
    inbox.completePreparedWith(claim, preparation, commercial, () => undefined);
    expect(db.prepare("SELECT user_id,mapping_id,status,next_attempt_at_utc FROM partner_alert_role_jobs WHERE refresh_required=1").all())
      .toEqual([{ user_id: userId, mapping_id: "target", status: "held", next_attempt_at_utc: now }]);
    expect(db.prepare("SELECT count(*) n FROM partner_alert_role_jobs WHERE status='applied'").get()).toEqual({ n: 3 });
    expect(db.prepare("SELECT status FROM partner_alert_whop_inbox").get()).toEqual({ status: "completed" });
  } finally { db.close(); }
});

vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({
  requirePlatformErasureWriter: () => ({ admittedUserIds: () => [qualifiedPaidInput().userId] }),
}));
vi.mock("./partner-alert-erasure-recovery", () => ({
  retainLatePartnerRoleOutcome: () => false,
}));

it.each([
  ["cancellation", "membership.updated", "inactive", true],
  ["refund", "refund.updated", "inactive", true],
  ["disconnect", "account.updated", "unknown", false],
  ["manual cancellation", "membership.updated", "inactive", false],
  ["manual failed renewal", "payment.failed", "inactive", false],
  ["manual refund", "refund.created", "inactive", false],
  ["manual dispute", "dispute.created", "inactive", false],
] as const)("reconciles %s while preserving unrelated Discord roles", async (scenario, eventType, state, removesRole) => {
  const db = new Database(":memory:");
  const base = qualifiedPaidInput();
  const manualRoleReview = scenario.startsWith("manual ");
  const otherRole = "810000000000000009";
  const roles = new Set([roleId, otherRole]);
  const authority = {
    refresh: async () => ({ ticket: base.ticket, authorityRevision: base.ticket.context.authorityRevision,
      linkedDiscordUserId: discordUserId, previousDiscordUserIds: [],
      input: { ...base, memberships: base.memberships.map(member => ({
        ...member, state: db.prepare("SELECT state FROM fixture_membership").pluck().get() as "active" | "inactive" | "unknown",
      })) } }),
    isCurrent: () => true,
    inCurrentWriter: <T>(operation: () => T) => db.transaction(operation).immediate(),
  };
  try {
    db.exec(`CREATE TABLE partner_alert_mappings(community_id,mapping_id,destination_guild_id,destination_role_id,ever_approved,
      PRIMARY KEY(community_id,mapping_id));
      CREATE TABLE platform_users(user_id PRIMARY KEY);
      CREATE TABLE fixture_membership(state);
      CREATE TABLE partner_alert_whop_connections(community_id,status,encrypted_authorisation_json);
      INSERT INTO fixture_membership VALUES('active');
      CREATE TABLE partner_alert_partners(community_id PRIMARY KEY);
      CREATE TABLE partner_alert_offer_channels(community_id,mapping_id,offer_id,offer_version INTEGER);`);
    for (const table of ["partner_alert_role_jobs", "partner_alert_whop_inbox"]) {
      const ddl = PARTNER_ALERT_SCHEMA_STATEMENTS.find(sql => sql.startsWith(`CREATE TABLE ${table} (`));
      expect(ddl).toBeDefined();
      db.exec(ddl!);
    }
    db.prepare("INSERT INTO partner_alert_partners VALUES (?)").run(base.communityId);
    db.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,'verified','fixture-envelope')").run(base.communityId);
    db.exec("INSERT INTO partner_alert_whop_connections VALUES ('unrelated','verified','unrelated-envelope')");
    db.prepare("INSERT INTO platform_users VALUES (?)").run(base.userId);
    db.prepare("INSERT INTO partner_alert_mappings VALUES (?,?,?,?,1)").run(base.communityId, mappingId, guildId, roleId);
    db.prepare(`INSERT INTO partner_alert_role_jobs(
      community_id,mapping_id,user_id,discord_user_id,desired_present,applied_present,authority_revision,decision_revision,
      decision_valid_until_utc,desired_ticket_json,managed_assignment_ref,status,next_attempt_at_utc
    ) VALUES (?,?,?,?,1,1,1,1,?,?,?,'applied',?)`).run(
      base.communityId, mappingId, base.userId, discordUserId, base.ticket.context.validUntilUtc,
      JSON.stringify(base.ticket), randomUUID(), base.nowUtc);
    const offer = base.offers[0]!.offer;
    const scope = { communityId: base.communityId, environment: offer.whop.environment,
      accountId: offer.whop.accountId, apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION } as const;
    db.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,?,?)").run(
      base.communityId, mappingId, offer.offerId, offer.version);
    const inbox = new PartnerAlertWhopInbox(db, { scope, nowUtc: () => base.nowUtc, createLeaseToken: randomUUID, manualRoleReview });
    const webhookId = "evt_fixture";
    const webhookTimestamp = String(Date.parse(base.nowUtc) / 1000);
    const signingKey = { secret: "ws_synthetic_test_key_only", encoding: "raw_utf8" } as const;
    const rawBody = Buffer.from(JSON.stringify({ id: webhookId, api_version: "v1", api_version_date: scope.apiVersionDate,
      account_id: scope.accountId, timestamp: base.nowUtc,
      type: eventType,
      data: eventType.startsWith("refund.") ? { payment: { id: "pay_fixture" } }
        : eventType === "payment.failed" ? { id: "pay_fixture" }
        : eventType === "dispute.created" ? { payment_id: "pay_fixture" }
        : { id: scenario === "disconnect" ? scope.accountId : "mem_fixture" },
    }));
    const signature = createHmac("sha256", signingKey.secret)
      .update(`${webhookId}.${webhookTimestamp}.`).update(rawBody).digest("base64");
    const message = { rawBody, webhookId, webhookTimestamp, webhookSignature: `v1,${signature}`, signingKey };
    for (const [name, value] of Object.entries({
      ENABLED: "true", ACCOUNT_ID: scope.accountId, COMMUNITY_ID: scope.communityId,
      ENVIRONMENT: scope.environment, SECRET: signingKey.secret, KEY_ENCODING: signingKey.encoding,
    })) vi.stubEnv(`PARTNER_ALERT_WHOP_WEBHOOK_${name}`, value);
    const statuses: string[] = [];
    receiveWhopEvent.mockImplementation((target, event) => {
      expect(target).toEqual(scope);
      statuses.push(inbox.receiveSignedEvent(event));
    });
    const send = (webhookSignature: string) => POST(new NextRequest("http://localhost/api/webhooks/partner-whop", {
      method: "POST", body: new Uint8Array(rawBody), headers: {
        "webhook-id": webhookId, "webhook-timestamp": webhookTimestamp, "webhook-signature": webhookSignature,
      },
    }));
    expect((await send("v1,invalid")).status).toBe(400);
    expect((await send(message.webhookSignature)).status).toBe(200);
    expect((await send(message.webhookSignature)).status).toBe(200);
    expect(statuses).toEqual(["recorded", "duplicate"]);
    const preparation = { status: "prepared", discoveryComplete: true, context: {
      communityId: base.communityId, userId: base.userId, offerId: offer.offerId, offerVersion: offer.version,
    } } as PartnerAlertWhopPreparation;
    const botUserId = "810000000000000007";
    const botRoleId = "810000000000000008";
    const channelId = "810000000000000006";
    const botToken = "synthetic_discord_bot_token";
    const guildPath = `/guilds/${guildId}`;
    const removalPath = `${guildPath}/members/${discordUserId}/roles/${roleId}`;
    const removeRole = vi.fn(() => roles.delete(roleId));
    const transport = createPartnerAlertManagedRoleTransport({
      botUserId, forbiddenRoleIds: [otherRole],
      readBinding: id => id === mappingId ? { guildId, mappingId, channelId, roleId, guildPermissions: "0", allowGrant: false } : null,
      createRest: scope => createPartnerAlertDiscordRoleRest({
        botUserId, botToken, maximumDurationMs: 1000,
        transport: async (url, request) => {
          expect(new URL(url).origin).toBe("https://discord.com");
          expect(request.headers).toMatchObject({ authorization: `Bot ${botToken}` });
          expect(request.redirect).toBe("manual");
          const path = new URL(url).pathname.replace(/^\/api\/v10/u, "");
          if (request.method === "DELETE") {
            expect(path).toBe(removalPath);
            removeRole();
            return new Response(null, { status: 204 });
          }
          expect(request.method).toBe("GET");
          if (path === "/users/@me") return Response.json({ id: botUserId, bot: true });
          if (path === `${guildPath}/roles`) return Response.json([
            { id: guildId, managed: false, permissions: "0", position: 0 },
            { id: roleId, managed: false, permissions: "0", position: 1 },
            { id: botRoleId, managed: false, permissions: String(1 << 28), position: 2 },
          ]);
          if (path === `${guildPath}/members/${botUserId}`) return Response.json({ user: { id: botUserId }, roles: [botRoleId] });
          if (path === `${guildPath}/channels`) return Response.json([{ id: channelId, guild_id: guildId, permission_overwrites: [] }]);
          throw new Error("Unexpected Discord fixture request");
        },
      }, scope),
    });
    const worker = new PartnerAlertRoleWorker(db, authority, transport,
      { enabled: true, nowUtc: () => base.nowUtc, createId: randomUUID, attention: vi.fn() });
    await runPartnerAlertLifecycleBatch({
      inbox, manualRoleReview,
      commercial: { retain: vi.fn() } as unknown as PartnerAlertWhopCommercialApply,
      roles: worker,
      prepare: async claim => {
        expect(claim.event.eventType).toBe(eventType);
        return preparation;
      },
      applyCurrentFacts: () => {
        if (scenario === "disconnect") expect(disconnectPartnerAlertWhopConnections(db, base.communityId)).toBe(1);
        db.prepare("UPDATE fixture_membership SET state=?").run(state);
      },
    });
    if (manualRoleReview) {
      expect(inbox.claim(120_000)).toBeNull();
      expect(db.prepare("SELECT status, last_error_code, attempts FROM partner_alert_whop_inbox").get())
        .toEqual({ status: "failed", last_error_code: "manual_role_review", attempts: 0 });
      expect(db.prepare("SELECT state FROM fixture_membership").pluck().get()).toBe("active");
      expect(removeRole).not.toHaveBeenCalled();
      expect([...roles]).toEqual([roleId, otherRole]);
      return;
    }
    expect(db.prepare("SELECT status FROM partner_alert_whop_inbox").pluck().get()).toBe("completed");
    expect(removeRole).toHaveBeenCalledTimes(removesRole ? 1 : 0);
    expect([...roles]).toEqual(removesRole ? [otherRole] : [roleId, otherRole]);
    expect(db.prepare("SELECT status, applied_present FROM partner_alert_role_jobs").get()).toEqual(
      removesRole ? { status: "applied", applied_present: 0 } : { status: "held", applied_present: 1 });
    if (scenario === "disconnect") {
      expect(db.prepare("SELECT status,encrypted_authorisation_json FROM partner_alert_whop_connections WHERE community_id=?")
        .get(base.communityId)).toEqual({ status: "disconnected", encrypted_authorisation_json: PARTNER_ALERT_REMOVED_CREDENTIAL_JSON });
      expect(db.prepare("SELECT encrypted_authorisation_json FROM partner_alert_whop_connections WHERE community_id='unrelated'").pluck().get())
        .toBe("unrelated-envelope");
    }
  } finally { db.close(); }
});

it.each([true, false])("applies a reviewed Stripe role loss only when Whop does not still cover it (%s)", async whopActive => {
  const db = new Database(":memory:");
  const base = qualifiedPaidInput();
  const otherMapping = "00000000-0000-4000-8000-000000000012";
  const otherRole = "810000000000000009";
  const roles = new Set([roleId, otherRole]);
  const scope = { userId: base.userId, communityId: base.communityId, mappingId };
  const offer = base.offers[0]!.offer;
  const intents = { operationId: "stripe-cancel", scope, desiredPresent: false, offerId: offer.offerId, offerVersion: offer.version };
  const authority = {
    refresh: async () => ({ ticket: base.ticket, authorityRevision: base.ticket.context.authorityRevision,
      linkedDiscordUserId: discordUserId, previousDiscordUserIds: [],
      input: { ...base, memberships: whopActive ? base.memberships : [],
        stripeFunding: { paidOffers: [], holdRemoval: false } } }),
    isCurrent: () => true,
    inCurrentWriter: <T>(operation: () => T) => db.transaction(operation).immediate(),
  };
  try {
    db.exec(`CREATE TABLE partner_alert_mappings(community_id,mapping_id,destination_guild_id,destination_role_id,ever_approved,
      PRIMARY KEY(community_id,mapping_id));
      CREATE TABLE platform_users(user_id PRIMARY KEY);
      CREATE TABLE partner_alert_stripe_role_reconciliations(operation_id PRIMARY KEY,community_id,buyer_user_id,mapping_id,
        desired_present INTEGER,status);
    `);
    db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(sql => sql.startsWith("CREATE TABLE partner_alert_role_jobs ("))!);
    db.prepare("INSERT INTO platform_users VALUES (?)").run(base.userId);
    const addMapping = db.prepare("INSERT INTO partner_alert_mappings VALUES (?,?,?,?,1)");
    const addJob = db.prepare(`INSERT INTO partner_alert_role_jobs(
      community_id,mapping_id,user_id,discord_user_id,desired_present,applied_present,authority_revision,decision_revision,
      decision_valid_until_utc,desired_ticket_json,managed_assignment_ref,status,next_attempt_at_utc
    ) VALUES (?,?,?,?,?,1,1,1,?,?,?,?,?)`);
    for (const [mapping, role, desired, status] of [[mappingId, roleId, 1, "applied"], [otherMapping, otherRole, 0, "pending"]] as const) {
      addMapping.run(base.communityId, mapping, guildId, role);
      addJob.run(base.communityId, mapping, base.userId, discordUserId, desired, base.ticket.context.validUntilUtc,
        JSON.stringify({ ...base.ticket, context: { ...base.ticket.context, mappingId: mapping, roleId: role } }),
        randomUUID(), status, base.nowUtc);
    }
    db.prepare("INSERT INTO partner_alert_stripe_role_reconciliations VALUES(?,?,?,?,0,'pending')")
      .run(intents.operationId, scope.communityId, scope.userId, scope.mappingId);
    const transport = {
      verifyManagedRole: vi.fn(async () => true),
      setRole: vi.fn(async (action: Parameters<ConstructorParameters<typeof PartnerAlertRoleWorker>[2]["setRole"]>[0]) => {
        expect(action).toMatchObject({ mappingId, guildId, discordUserId, roleId, present: false });
        expect(action.stillCurrent()).toBe(true);
        roles.delete(roleId);
        return { kind: "confirmed" as const, guildId, discordUserId, roleId, present: false };
      }),
    };
    const worker = new PartnerAlertRoleWorker(db, authority, transport, { enabled: true,
      nowUtc: () => base.nowUtc, createId: randomUUID, attention: vi.fn() });
    await expect(reconcilePartnerAlertStripeRole(db, { intent: intents, authority, worker, nowUtc: () => base.nowUtc }))
      .resolves.toBe("applied");
    expect(transport.setRole).toHaveBeenCalledTimes(whopActive ? 0 : 1);
    expect([...roles]).toEqual(whopActive ? [roleId, otherRole] : [otherRole]);
    expect(db.prepare("SELECT status FROM partner_alert_role_jobs WHERE mapping_id=?").pluck().get(otherMapping)).toBe("pending");
  } finally { db.close(); }
});

it.runIf(process.env.PARTNER_STRIPE_QA_NATIVE_DISCORD === "1")("the native Stripe reconciliation changes only its assigned Discord test role", async () => {
  const fixture = await createPartnerAlertStripeDiscordTestGuild({
    guildId: "1559172784813514803", memberId: "1435015362558165084", unrelatedMemberId: "1470105999389229092",
    botToken: process.env.PARTNER_STRIPE_DISCORD_BOT_TOKEN ?? "",
  });
  const db = new Database(":memory:");
  try {
    const existing = await fixture.prepare();
    const base = qualifiedPaidInput();
    const { communityId, userId } = base;
    const offer = base.offers[0]!.offer;
    const ticket = {
      premium: { ...base.ticket.premium, scope: { ...base.ticket.premium.scope, guildId: fixture.guildId, discordUserId: fixture.memberId } },
      context: { ...base.ticket.context, guildId: fixture.guildId, roleId: fixture.roleId, linkedDiscordUserId: fixture.memberId },
    };
    const sourceGuildId = "1560477414445031464";
    const sourceChannelId = "810000000000000006";
    const scope = { userId, communityId, mappingId };
    let stillCovered = true;
    const authority = {
      refresh: async () => ({ ticket, authorityRevision: ticket.context.authorityRevision,
        linkedDiscordUserId: fixture.memberId, previousDiscordUserIds: [],
        input: { ...base, ticket, premium: { ...base.premium!, ticket: ticket.premium },
          discord: { ...base.discord!, guildId: fixture.guildId, discordUserId: fixture.memberId },
          policy: { ...base.policy, destinationGuildId: fixture.guildId },
          mappings: [{ ...base.mappings[0]!, destinationGuildId: fixture.guildId, destinationRoleId: fixture.roleId }],
          memberships: stillCovered ? base.memberships : [],
          stripeFunding: { paidOffers: [], holdRemoval: false } } }),
      isCurrent: () => true,
      inCurrentWriter: <T>(operation: () => T) => db.transaction(operation).immediate(),
    };
    db.exec(`CREATE TABLE platform_users(user_id PRIMARY KEY);
      CREATE TABLE partner_alert_partners(community_id PRIMARY KEY,status);
      CREATE TABLE partner_alert_mappings(community_id,mapping_id,source_guild_id,source_channel_id,
        destination_guild_id,destination_channel_id,destination_role_id,ever_approved,review_state,revision,approved_revision,
        PRIMARY KEY(community_id,mapping_id));
      CREATE TABLE partner_alert_offer_channels(community_id,offer_id,offer_version,mapping_id);
      CREATE TABLE partner_alert_stripe_role_reconciliations(operation_id PRIMARY KEY,community_id,buyer_user_id,mapping_id,
        desired_present INTEGER,status);`);
    db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(sql => sql.startsWith("CREATE TABLE partner_alert_role_jobs ("))!);
    db.prepare("INSERT INTO platform_users VALUES (?)").run(userId);
    db.prepare("INSERT INTO partner_alert_partners VALUES (?,'active')").run(communityId);
    db.prepare("INSERT INTO partner_alert_mappings VALUES (?,?,?,?,?,?,?,1,'approved',1,1)").run(communityId, mappingId,
      sourceGuildId, sourceChannelId, fixture.guildId, fixture.channelId, fixture.roleId);
    db.prepare("INSERT INTO partner_alert_offer_channels VALUES (?,?,1,?)").run(communityId, offer.offerId, mappingId);
    db.prepare(`INSERT INTO partner_alert_role_jobs
      (community_id,mapping_id,user_id,discord_user_id,desired_present,applied_present,authority_revision,decision_revision,
       decision_valid_until_utc,desired_ticket_json,managed_assignment_ref,status,next_attempt_at_utc)
      VALUES (?,?,?,?,1,1,1,1,?,?,?,'applied',?)`).run(communityId, mappingId, userId, fixture.memberId,
        ticket.context.validUntilUtc, JSON.stringify(ticket), randomUUID(), base.nowUtc);
    const bind = createPartnerAlertStripeRolePorts(db, {
      readOutput: () => ({ discordBotUserId: fixture.botId, discordBotToken: fixture.token, outputConfigurationRef: "test",
        outputBindings: [{ communityId, sourceGuildId, sourceChannelId, destinationGuildId: fixture.guildId,
          destinationChannelId: fixture.channelId, destinationRoleId: fixture.roleId }] }),
      protectedRoleIds: existing.filter(id => id !== fixture.roleId),
      bindCurrentAuthority: () => authority, nowUtc: () => base.nowUtc, reportFailure: () => undefined,
    });
    for (const id of ["stripe-first-review", "stripe-confirmed-end"]) {
      const intent = { operationId: id, scope, desiredPresent: false, offerId: offer.offerId, offerVersion: 1 };
      db.prepare("INSERT INTO partner_alert_stripe_role_reconciliations VALUES(?,?,?,?,0,'pending')")
        .run(id, communityId, userId, mappingId);
      const ports = bind(intent);
      expect(ports).not.toBeNull();
      await expect(reconcilePartnerAlertStripeRole(db, { intent, ...ports!, nowUtc: () => base.nowUtc })).resolves.toBe("applied");
      await fixture.verify(stillCovered);
      stillCovered = false;
    }
  } finally {
    try { await fixture.cleanup(); }
    finally { db.close(); }
  }
}, 60_000);
