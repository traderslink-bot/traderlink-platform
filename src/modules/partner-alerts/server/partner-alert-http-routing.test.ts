// @vitest-environment node
import type Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";

import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, JOURNAL_ADMIN_REQUEST_HEADER } from "../../platform/contracts/journal-admin-request";
import { PartnerAlertHttpAdapter, partnerAlertOwnerMutationRequestDenied, partnerAlertPrivateReadFailure } from "./partner-alert-http";
import { PartnerAlertRequestWriter } from "./partner-alert-request-writer";
import { parsePartnerAlertWorkflowCommand } from "./partner-alert-workflow";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

const origin = "https://app.example.test";
const communityId = "11111111-1111-4111-8111-111111111111";
const otherCommunityId = "22222222-2222-4222-8222-222222222222";

function ownerRequest(overrides: Record<string, string | null> = {}, body: Record<string, unknown> = {}) {
  const headers = new Headers({ host: "app.example.test", origin, "sec-fetch-site": "same-origin",
    "x-traderlink-platform-mutation": "1", "content-type": "application/json",
    "x-traderlink-partner-alert-idempotency-key": "44444444-4444-4444-8444-444444444444" });
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) headers.delete(key); else headers.set(key, value);
  }
  return new Request(`${origin}/api/partner-channels/communities/${communityId}`, {
    method: "POST", headers, body: JSON.stringify({ action: "savePartnerDraft", communityId,
      expectedRevision: 1, displayName: "Synthetic community", contentPolicy: {
        blockedServerNames: [], blockedPhrases: [], authorMode: "all_humans", allowedAuthorIds: [],
      }, ...body }),
  });
}

describe("Partner owner security rejection before evidence refresh", () => {
  const invalidHeaders: Record<string, string | null>[] = [
    { origin: "https://invalid.example" }, { origin: null }, { origin: "not a URL" },
    { "x-traderlink-platform-mutation": null }, { "x-traderlink-platform-mutation": "0" },
    { "sec-fetch-site": "cross-site" }, { host: null },
  ];
  it.each(invalidHeaders)("returns a private rejection for the actual guard failure %#", async headers => {
    const response = partnerAlertOwnerMutationRequestDenied(ownerRequest(headers));
    expect(response?.status).toBe(403);
    expect(response?.headers.get("cache-control")).toContain("no-store");
    await expect(response?.json()).resolves.toEqual({ ok: false, code: "forbidden",
      message: "This action could not be authorized." });
  });

  it("continues a valid request without substituting identity or writer authority", () => {
    expect(partnerAlertOwnerMutationRequestDenied(ownerRequest())).toBeNull();
  });

  it.each([new Error("private unknown failure"),
    { name: "TraderLinkPlatformError", code: "TRADERLINK_WORKSPACE_ACCESS_DENIED" }])(
    "does not classify an unknown or lookalike exception as a security rejection %#", failure => {
      const request = ownerRequest();
      vi.spyOn(request.headers, "get").mockImplementation(() => { throw failure; });
      let caught: unknown;
      try { partnerAlertOwnerMutationRequestDenied(request); } catch (error) { caught = error; }
      expect(caught).toBe(failure);
      expect(partnerAlertPrivateReadFailure(failure).status).toBe(503);
    },
  );

  it("does not reclassify another genuine platform error", () => {
    const request = ownerRequest();
    vi.spyOn(request.headers, "get").mockImplementation(() => platformFailure("TRADERLINK_AUTH_SESSION_INVALID"));
    expect(() => partnerAlertOwnerMutationRequestDenied(request)).toThrow();
  });

  it("retains the existing forged-authority 403 contract before writer or provider work", async () => {
    const databaseRead = vi.fn(() => { throw Error("Unexpected database use"); });
    const provider = vi.fn();
    const writer = new PartnerAlertRequestWriter({ prepare: databaseRead } as unknown as Database.Database, {
      environment: { NODE_ENV: "production", DISCORD_GUILD_ID: "100000000000000001" },
      now: () => new Date("2026-11-02T12:00:00.000Z"), createId: () => communityId,
      destinationGuildId: "100000000000000001", maximumActorAgeMs: 30_000,
      maximumDiscordEvidenceAgeMs: 300_000, outputBotUserId: "200000000000000002",
      outputConfigurationRef: "synthetic_output_v1",
    });
    const adapter = new PartnerAlertHttpAdapter({ enabled: true }, { configuredOrigin: origin }, writer, provider);
    const response = await adapter.handleMutation(ownerRequest({}, { actorUserId: otherCommunityId }),
      { kind: "community_owner", communityId }, communityId);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "forbidden" });
    expect(databaseRead).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });
});

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
