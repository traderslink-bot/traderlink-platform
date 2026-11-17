// @vitest-environment node
import Database from "better-sqlite3";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyPlatformRestoreStartupProof } from "../../platform/server/privacy/platform-erasure-restore-startup-proof";
import { platformPaidWhopCoverageEvidenceMigration } from "../../platform/server/database/migrations/0208_platform_paid_whop_coverage_evidence";
import { sanitizePlatformRestorePage } from "../../platform/server/privacy/platform-erasure-restore-quarantine";
import { PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS } from "../../platform/server/privacy/platform-erasure-text-successor-schema";
import { disconnectPartnerAlertWhopConnections, PARTNER_ALERT_REMOVED_CREDENTIAL_JSON } from "./partner-alert-retention-policy";
import { purgeExpiredPartnerAlertWhopEvidence, purgePartnerAlertWhopEvidence } from "./partner-alert-whop-evidence-retention";
import { expect, it, vi } from "vitest";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS } from "./database/partner-alert-whop-evidence-schema";
import type { PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "../../platform/contracts/platform-request-security";
import { checkPartnerAlertSubscriberAccess, verifyPartnerAlertSubscriberOffer } from "./partner-alert-subscriber-access";
import { createPartnerAlertWhopReceiptReader } from "./partner-alert-whop-evidence-reader";
import { PartnerAlertWhopEvidenceWriter } from "./partner-alert-whop-evidence-writer";

const admission = vi.hoisted(() => ({ require: vi.fn() }));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({
  requirePlatformErasureWriter: admission.require,
  erasureHold: () => { throw new Error("admission held"); },
}));

it.each(["applied", "reader", "membership cascade", "subscriber fence", "publisher fence", "disconnect", "expiry", "restore", "stale coverage", "stale lease", "stale erasure generation", "erasing", "foreign membership", "no qualification"] as const)(
  "checks admitted access evidence with %s", async outcome => {
    const db = new Database(":memory:");
    try {
      db.pragma("foreign_keys=ON");
      db.exec(`CREATE TABLE platform_users(user_id PRIMARY KEY);
        CREATE TABLE partner_alert_partners(community_id PRIMARY KEY);
        CREATE TABLE partner_alert_offers(
          community_id,offer_id,version,whop_environment,whop_account_id,review_state,offer_json,
          UNIQUE(community_id,offer_id,version,whop_environment,whop_account_id));`);
      for (const name of ["whop_connections", "whop_identities", "memberships", "whop_inbox"]) {
        db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(sql => sql.startsWith(`CREATE TABLE partner_alert_${name} (`))!);
      }
      for (const statement of PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS) db.exec(statement);
      const base = qualifiedPaidInput();
      const offer = base.offers[0]!.offer;
      const { communityId, userId, nowUtc } = base;
      const whopUserRef = base.whopUserRef!;
      const { offerId, version: offerVersion, whop: { environment, accountId, productId, planId } } = offer;
      const context = { communityId, userId, offerId, offerVersion, environment, accountId, productId,
        planId, currencyCode: offer.currency.code, verifiedWhopUserRef: whopUserRef,
        claimedGenerations: { identity: 1, connection: 2, erasure: 3 } };
      const validUntilUtc = base.memberships[0]!.validUntilUtc;
      db.prepare("INSERT INTO platform_users VALUES (?)").run(userId);
      db.prepare("INSERT INTO partner_alert_partners VALUES (?)").run(communityId);
      db.prepare("INSERT INTO partner_alert_offers VALUES (?,?,?,?,?,'approved',?)")
        .run(communityId, offerId, offerVersion, environment, accountId, JSON.stringify(offer));
      db.prepare("INSERT INTO partner_alert_whop_identities VALUES (?,?,?,'verified',?)")
        .run(userId, environment, whopUserRef, nowUtc);
      db.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,?,?,?,?,'{}','verified',?,?)")
        .run("11111111-1111-4111-8111-111111111111", communityId, environment, accountId, whopUserRef, nowUtc, validUntilUtc);
      const fact = base.memberships[0]!;
      const event = { communityId, environment, accountId, eventId: "evt_fixture", eventType: "membership.updated",
        resourceKind: "membership" as const, resourceId: fact.membershipId, payloadSha256: "a".repeat(64),
        occurredAtUtc: nowUtc, apiVersionDate: "2026-10-27-2" as const };
      const claim = { event, leaseToken: "11111111-1111-4111-8111-111111111111",
        admissionFence: {}, attempts: 1 } as PartnerAlertWhopInboxClaim;
      db.prepare(`INSERT INTO partner_alert_whop_inbox(admission_fence_json,environment,whop_account_id,
        event_id,community_id,event_type,api_version_date,resource_kind,resource_id,payload_sha256,status,
        available_at_utc,lease_token,lease_until_utc,occurred_at_utc,received_at_utc)
        VALUES ('{}',?,?,?,?,?,?,?,?,?,'processing',?,?,?,?,?)`).run(environment, accountId, event.eventId,
        communityId, event.eventType, event.apiVersionDate, event.resourceKind, event.resourceId, event.payloadSha256,
        nowUtc, claim.leaseToken, outcome === "stale lease" ? nowUtc : validUntilUtc, nowUtc, nowUtc);
      const preparation = { status: "prepared", canApply: false, provenance: "current_runtime_unbound",
        discoveryComplete: true, discoveredMembershipCount: 1, issues: [], finishedAtUtc: nowUtc,
        context, members: [{ kind: "prepared", membershipId: fact.membershipId,
          evidence: { ...fact, userId: outcome === "foreign membership" ? "foreign" : userId,
            paidCoverage: { ...fact.paidCoverage!, endsAtUtc: outcome === "stale coverage" ? nowUtc : fact.paidCoverage!.endsAtUtc } },
          paymentIds: [], paymentFacts: [] }] } as unknown as PartnerAlertWhopPreparation;
      admission.require.mockReturnValue({ now: () => nowUtc, lifecycle: () => ({ erasure_generation: outcome === "stale erasure generation" ? 4 : 3 }),
        assertLivePrincipal: () => { if (outcome === "erasing") throw new Error("admission held"); } });
      const writer = new PartnerAlertWhopEvidenceWriter(db, {
        recheckCurrent: () => ({ ...context, kind: "admitted", validUntilUtc,
          admissionRef: claim.leaseToken, generations: context.claimedGenerations }),
        qualifyCoverage: () => outcome === "no qualification" ? null
          : ({ qualificationRef: fact.paidCoverage!.qualificationRef, validUntilUtc }),
      });
      const count = (table: string) => db.prepare(`SELECT count(*) FROM ${table}`).pluck().get();
      const run = () => db.transaction(() => writer.apply(claim, preparation)).immediate();
      if (["stale coverage", "stale lease", "stale erasure generation", "erasing",
        "foreign membership", "no qualification"].includes(outcome)) {
        expect(run).toThrow("admission held");
        expect(count("partner_alert_whop_discovery")).toBe(0);
        expect(count("partner_alert_memberships")).toBe(0);
        return;
      }
      run();
      expect(admission.require).toHaveBeenCalledWith(db, userId);
      expect(count("partner_alert_whop_discovery")).toBe(1);
      expect(count("partner_alert_whop_paid_intervals")).toBe(1);
      expect(run).toThrow("admission held");
      if (outcome === "reader") {
        db.exec("CREATE TABLE partner_alert_offer_channels(community_id,mapping_id,offer_id,offer_version)");
        db.prepare("INSERT INTO partner_alert_offer_channels VALUES(?,?,?,?)")
          .run(communityId, base.mappingId, offerId, offerVersion);
        let at = nowUtc;
        let generations = context.claimedGenerations;
        const reader = createPartnerAlertWhopReceiptReader(db, {
          environment, nowUtc: () => at, maximumEvidenceAgeMs: 300_000,
          qualification: { kind: "qualified", qualificationRef: fact.paidCoverage!.qualificationRef,
            apiVersion: "fixture", schemaSha256: "a".repeat(64) },
          readCurrentGenerations: () => generations,
          readDiscord: () => ({ evidence: base.discord!, previousDiscordUserIds: [] }),
        });
        const read = db.transaction(() => reader(base.ticket));
        const subscriber = { userId, communityId, offerId, offerVersion, mappingIds: offer.mappingIds };
        const authority = {
          refresh: async () => ({ ticket: base.ticket, linkedDiscordUserId: base.ticket.context.linkedDiscordUserId,
            previousDiscordUserIds: [], authorityRevision: base.ticket.context.authorityRevision,
            input: { ...base, ...(read() ?? {}), nowUtc: at } }),
          isCurrent: () => reader(base.ticket) !== null,
          inCurrentWriter: <T>(operation: () => T) => db.transaction(operation).immediate(),
        };
        const observe = async () => ({ guildId: base.discord!.guildId, discordUserId: base.discord!.discordUserId,
          roleIds: [base.ticket.context.roleId], observedAtUtc: at,
          validUntilUtc: new Date(Date.parse(at) + 15_000).toISOString() });
        const request = new Request("https://app.example.test/access", { method: "POST",
          headers: { "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
            origin: "https://app.example.test", host: "app.example.test" } });
        const checkPage = () => verifyPartnerAlertSubscriberOffer(subscriber, authority, () => at, observe);
        const checkPost = () => checkPartnerAlertSubscriberAccess(request, () => subscriber, () => authority, () => at, observe);
        expect(reader(base.ticket)).toBeNull();
        expect(read()?.memberships[0]?.paidCoverage).toEqual(fact.paidCoverage);
        await expect(checkPage()).resolves.toBe("subscribed");
        expect(await (await checkPost()).json()).toMatchObject({ code: "subscribed" });
        db.prepare("UPDATE partner_alert_whop_paid_intervals SET ends_at_utc=?").run(nowUtc);
        expect(read()?.memberships[0]?.paidCoverage).toBeUndefined();
        await expect(checkPage()).resolves.toBe("unavailable");
        expect((await checkPost()).status).toBe(503);
        generations = { ...generations, connection: 3 };
        expect(read()).toBeNull();
        generations = context.claimedGenerations;
        at = validUntilUtc;
        expect(read()).toBeNull();
        at = nowUtc;
        disconnectPartnerAlertWhopConnections(db, communityId, { environment, accountId });
        expect(read()).toBeNull();
        return;
      }
      if (outcome === "applied") {
        db.prepare("DELETE FROM partner_alert_whop_identities WHERE user_id=?").run(userId);
      } else if (outcome === "membership cascade") {
        expect(() => db.exec(`UPDATE partner_alert_whop_paid_intervals SET membership_id='mem_other'`))
          .toThrow(/FOREIGN KEY/u);
        db.exec("DELETE FROM partner_alert_memberships");
        expect(count("partner_alert_whop_discovery")).toBe(1);
      } else if (outcome === "subscriber fence") {
        expect(() => purgePartnerAlertWhopEvidence(db, { kind: "subscriber", userId })).toThrow(/writer_required/u);
        db.transaction(() => purgePartnerAlertWhopEvidence(db, { kind: "subscriber", userId })).immediate();
        expect(count("partner_alert_whop_identities")).toBe(1);
      } else if (outcome === "publisher fence") {
        expect(disconnectPartnerAlertWhopConnections(db, communityId)).toBe(1);
        expect(count("partner_alert_whop_connections")).toBe(1);
        expect(db.prepare("SELECT status FROM partner_alert_whop_connections").pluck().get()).toBe("disconnected");
        expect(run).toThrow("admission held");
      } else if (outcome === "expiry") {
        expect(purgeExpiredPartnerAlertWhopEvidence(db, nowUtc)).toBe(0);
        expect(purgeExpiredPartnerAlertWhopEvidence(db, validUntilUtc)).toBe(1);
      } else if (outcome === "disconnect") {
        const otherAccount = "biz_other";
        db.prepare("INSERT INTO partner_alert_offers VALUES (?,?,2,?,?,'approved','{}')")
          .run(communityId, offerId, environment, otherAccount);
        db.prepare("INSERT INTO partner_alert_whop_connections VALUES (?,?,?,?,?,'{}','verified',?,?)")
          .run("22222222-2222-4222-8222-222222222222", communityId, environment, otherAccount, whopUserRef, nowUtc, validUntilUtc);
        db.prepare(`INSERT INTO partner_alert_whop_discovery
          SELECT community_id,user_id,offer_id,2,environment,?,observed_at_utc,valid_until_utc,qualification_ref,
          identity_generation,connection_generation,erasure_generation FROM partner_alert_whop_discovery`).run(otherAccount);
        db.exec(`CREATE TRIGGER reject_disconnect BEFORE UPDATE ON partner_alert_whop_connections
          BEGIN SELECT RAISE(ABORT,'fixture rollback'); END`);
        expect(() => disconnectPartnerAlertWhopConnections(db, communityId, { environment, accountId }))
          .toThrow("fixture rollback");
        expect(count("partner_alert_whop_discovery")).toBe(2);
        expect(count("partner_alert_whop_paid_intervals")).toBe(1);
        db.exec("DROP TRIGGER reject_disconnect");
        expect(disconnectPartnerAlertWhopConnections(db, communityId, { environment, accountId })).toBe(1);
        expect(db.prepare("SELECT status,encrypted_authorisation_json FROM partner_alert_whop_connections WHERE whop_account_id=?")
          .get(accountId)).toEqual({ status: "disconnected", encrypted_authorisation_json: PARTNER_ALERT_REMOVED_CREDENTIAL_JSON });
        expect(db.prepare("SELECT whop_account_id FROM partner_alert_whop_discovery").pluck().all()).toEqual([otherAccount]);
        expect(db.prepare("SELECT status FROM partner_alert_whop_connections WHERE whop_account_id=?")
          .pluck().get(otherAccount)).toBe("verified");
        expect(run).toThrow("admission held");
        expect(count("partner_alert_whop_discovery")).toBe(1);
      } else if (outcome === "restore") {
        db.exec(`CREATE TABLE platform_erasure_module_operations(operation_ref TEXT PRIMARY KEY);
          CREATE TABLE platform_erasure_operation_claims(operation_ref TEXT,participant TEXT,claim_ref TEXT,
            original_sha256 TEXT,original_json TEXT,state TEXT,outcome_ref TEXT);
          CREATE TABLE platform_auth_sessions(created_at_utc TEXT,revoked_at_utc TEXT);
          CREATE TABLE partner_alert_source_messages(community_id TEXT,source_channel_id TEXT,message_id TEXT,
            text_content TEXT,state TEXT,hold_issues_json TEXT,retain_until_utc TEXT);
          CREATE TABLE partner_alert_source_revisions(community_id TEXT,source_channel_id TEXT,message_id TEXT,
            observed_at_utc TEXT,text_content TEXT);
          CREATE TABLE partner_alert_deliveries(community_id TEXT,source_channel_id TEXT,message_id TEXT,
            action TEXT,status TEXT,text_content TEXT,last_error_code TEXT,outcome_json TEXT);`);
        for (const sql of PLATFORM_ERASURE_TEXT_SUCCESSOR_STATEMENTS) db.exec(sql);
        const root = mkdtempSync(join(tmpdir(), "partner-whop-restore-"));
        try {
          const databasePath = join(root, "image.sqlite");
          const { privateKey, publicKey } = generateKeyPairSync("ed25519");
          const digest = "d".repeat(64);
          const verifyImage = () => {
            const bytes = db.serialize();
            writeFileSync(databasePath, bytes);
            const signedPayload = JSON.stringify({ version: 1,
              databaseSha256: createHash("sha256").update(bytes).digest("hex"),
              ledgerSha256: digest, keyringSha256: digest, inventorySha256: digest, expiresAtUtc: validUntilUtc });
            verifyPlatformRestoreStartupProof({ databasePath, signedPayload, nowUtc,
              signature: sign(null, Buffer.from(signedPayload), privateKey).toString("base64url"),
              publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
              expectedLedgerSha256: digest, expectedKeyringSha256: digest, expectedInventorySha256: digest });
          };
          expect(verifyImage).toThrow("platform_restore_startup_held");
          db.transaction(() => sanitizePlatformRestorePage(db, nowUtc, { ref: "fixture", bytes: Buffer.alloc(32, 1) })).immediate();
          expect(verifyImage).not.toThrow();
        } finally { rmSync(root, { recursive: true, force: true }); }
        expect(db.prepare("SELECT encrypted_authorisation_json FROM partner_alert_whop_connections").pluck().get())
          .toBe(PARTNER_ALERT_REMOVED_CREDENTIAL_JSON);
        expect(run).toThrow("admission held");
      }
      const receiptRemains = outcome === "membership cascade" || outcome === "disconnect";
      expect(count("partner_alert_whop_discovery")).toBe(receiptRemains ? 1 : 0);
      expect(count("partner_alert_whop_paid_intervals")).toBe(0);
      expect(db.pragma("foreign_key_check")).toEqual([]);
    } finally { db.close(); }
  },
);


it("pins the Whop coverage migration identity and statements", () => {
  expect(platformPaidWhopCoverageEvidenceMigration).toMatchObject({
    moduleNamespace: "platform", migrationId: "0208_platform_paid_whop_coverage_evidence",
    statements: PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS,
  });
  expect(createHash("sha256").update(JSON.stringify(PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS)).digest("hex"))
    .toBe("34b69a77b8cd1a008b15f290e8c638a2bc71c5891989a4a114970a40a9b4bcdf");
});
