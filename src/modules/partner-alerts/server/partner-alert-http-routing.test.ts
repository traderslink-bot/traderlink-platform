// @vitest-environment node
import type Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";

import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, JOURNAL_ADMIN_REQUEST_HEADER } from "../../platform/contracts/journal-admin-request";
import { PartnerAlertHttpAdapter } from "./partner-alert-http";
import { PartnerAlertRequestWriter } from "./partner-alert-request-writer";
import { parsePartnerAlertWorkflowCommand } from "./partner-alert-workflow";

const origin = "https://app.example.test";
const communityId = "11111111-1111-4111-8111-111111111111";
const otherCommunityId = "22222222-2222-4222-8222-222222222222";

describe("Partner Channel trusted route target", () => {
  it.each(["requestChanges", "declinePartner"])("rejects %s for another path community before provider or database work", async action => {
    const verifyProviders = vi.fn();
    const writer = new PartnerAlertRequestWriter({} as Database.Database, {
      environment: { NODE_ENV: "production", DISCORD_GUILD_ID: "100000000000000001" },
      now: () => new Date("2026-11-02T12:00:00.000Z"),
      createId: () => "33333333-3333-4333-8333-333333333333",
      destinationGuildId: "100000000000000001",
      maximumActorAgeMs: 30_000,
      maximumDiscordEvidenceAgeMs: 300_000,
      outputBotUserId: "200000000000000002",
      outputConfigurationRef: "synthetic_output_v1",
    });
    const adapter = new PartnerAlertHttpAdapter({ enabled: true }, { configuredOrigin: origin }, writer, verifyProviders);
    const request = new Request(`${origin}/api/admin/journal/partner-channels/${otherCommunityId}`, {
      method: "POST",
      headers: {
        host: "app.example.test",
        origin,
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
        [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
        [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: "44444444-4444-4444-8444-444444444444",
      },
      body: JSON.stringify({ action, communityId, expectedRevision: 1,
        reason: "Synthetic route mismatch" }),
    });
    const response = await adapter.handleMutation(request, { kind: "operator" }, otherCommunityId);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "invalid_request" });
    expect(verifyProviders).not.toHaveBeenCalled();
  });

  it("requires an operator and a bounded reason to decline a Partner Channels application", () => {
    const command = { action: "declinePartner", communityId, expectedRevision: 2, reason: "  Review access required  " };
    expect(parsePartnerAlertWorkflowCommand(command, { kind: "operator" })).toEqual({ ...command, reason: "Review access required" });
    expect(() => parsePartnerAlertWorkflowCommand(command, { kind: "community_owner", communityId })).toThrow();
    expect(() => parsePartnerAlertWorkflowCommand({ ...command, reason: "x".repeat(501) }, { kind: "operator" })).toThrow();
  });
});
