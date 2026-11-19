// @vitest-environment node
import Database from "better-sqlite3";
import { generateKeyPairSync, sign } from "node:crypto";
import { expect, it, vi } from "vitest";
import type { StripeErasureRoleFacts, StripeErasureRoleProof } from "../../../partner-alerts/server/partner-alert-stripe-erasure-role-proof";
import { verifyPlatformStripeErasureRoleProof } from "./platform-stripe-erasure-proof-verifier";

const fixture = vi.hoisted(() => ({ entries: [] as StripeErasureRoleFacts[] }));
vi.mock("../../../partner-alerts/server/partner-alert-stripe-erasure-role-proof", () => ({
  encodePartnerAlertStripeErasureRoleProof: (proof: StripeErasureRoleProof) => Buffer.from(JSON.stringify(proof)),
  readPartnerAlertStripeErasureRoleFacts: () => ({ affectedSourceSha256: "a".repeat(64), entries: fixture.entries }),
}));
const approved = "1559172784813514803";
const foreign = "1559172784813514804";
for (const mode of ["root", "restore"] as const) {
  for (const [source, destination, allowed] of [
    [approved, approved, true], [foreign, approved, false], [approved, foreign, false],
  ] as const) {
    it(`${mode} verifies only the approved source and destination before reading settlement (${source}, ${destination})`, () => {
      const db = new Database(":memory:");
      try {
        db.exec("CREATE TABLE partner_alert_mappings(community_id TEXT,mapping_id TEXT,source_guild_id TEXT)");
        db.prepare("INSERT INTO partner_alert_mappings VALUES ('community','mapping',?)").run(source);
        const facts: StripeErasureRoleFacts = {
          scope: { community_id: "community", buyer_user_id: "buyer", mapping_id: "mapping" },
          guildId: destination, roleId: "1559172784813514805",
          stripeAuthoritySha256: "b".repeat(64), whopAuthoritySha256: "c".repeat(64), mappingSha256: "d".repeat(64),
        };
        fixture.entries = [facts];
        const base = { operationRef: "op", userId: "buyer", workspaceId: "workspace", lifecycleRef: "lifecycle",
          erasureGeneration: 1, catalogSha256: "e".repeat(64), schemaSha256: "f".repeat(64), appliedLedgerSha256: "a".repeat(64) };
        const scope = mode === "root"
          ? { ...base, mode, writerFenceRef: "fence", writerFenceGeneration: 1 }
          : { ...base, mode, snapshotSha256: "b".repeat(64), tombstoneRef: "tombstone",
            tombstoneLedgerGeneration: 1, tombstoneLedgerSha256: "c".repeat(64), restoreKeyringSha256: "d".repeat(64) };
        const now = "2026-11-17T18:00:00.000Z";
        const proof: StripeErasureRoleProof = {
          keyId: "synthetic", receiptId: "receipt", issuedAtUtc: now, expiresAtUtc: "2026-11-17T18:00:10.000Z",
          scope, affectedSourceSha256: "a".repeat(64),
          entries: [{ ...facts, discordUserId: "1559172784813514806", settledTransportSha256: "e".repeat(64),
            desiredPresent: false, observedPresent: false, observedAtUtc: now }],
        };
        const keys = generateKeyPairSync("ed25519");
        const readSettlement = vi.fn(() => ({
          discordUserId: proof.entries[0]!.discordUserId,
          settledTransportSha256: proof.entries[0]!.settledTransportSha256,
          settledAtUtc: now, desiredPresent: false,
        }));
        const run = db.transaction(() => {
          const confirm = verifyPlatformStripeErasureRoleProof(db, {
            proof, signature: sign(null, Buffer.from(JSON.stringify(proof)), keys.privateKey).toString("base64url"),
            publicKey: keys.publicKey, keyId: "synthetic", expectedScope: scope, nowUtc: now,
            maximumLifetimeMs: 10_000, readSettlement,
          });
          expect(confirm(facts.scope)).toBe(true);
        });
        if (allowed) {
          run();
          expect(readSettlement).toHaveBeenCalledOnce();
        } else {
          expect(run).toThrow();
          expect(readSettlement).not.toHaveBeenCalled();
        }
      } finally { db.close(); }
    });
  }
}
