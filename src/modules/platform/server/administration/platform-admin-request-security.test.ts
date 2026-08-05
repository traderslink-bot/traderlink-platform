import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import {
  consumeJournalAdminRateLimit,
  JOURNAL_ADMIN_IDEMPOTENCY_HEADER,
  JOURNAL_ADMIN_REQUEST_HEADER,
  journalAdminMutationCorrelation,
  journalAdminPrivateHeaders,
  requireJournalAdminMutationRequest,
  requireJournalAdminPermission,
  resetJournalAdminRateLimitsForTests,
} from "./platform-admin-request-security";

const USER_ID = "10000000-0000-4000-8000-000000000001";
const SECRET = "journal-admin-test-rate-limit-secret";
const NOW = () => new Date("2026-08-03T07:00:00.000Z");

afterEach(() => {
  resetJournalAdminRateLimitsForTests();
});

function mutationRequest(headers: HeadersInit = {}): Request {
  return new Request("https://dashboard.traderslink.pro/api/admin/journal/test", {
    method: "POST",
    headers: {
      host: "dashboard.traderslink.pro",
      origin: "https://dashboard.traderslink.pro",
      "sec-fetch-site": "same-origin",
      [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
      ...headers,
    },
  });
}

describe("Journal admin request security", () => {
  it("binds a canonical mutation key to the exact operator, action and target", () => {
    const scope: JournalAdminScope = Object.freeze({
      userId: USER_ID,
      role: "journal_owner_admin",
      mode: "production_discord_owner",
      authorizedAtUtc: NOW().toISOString(),
      discordOwnerVerifiedAtUtc: NOW().toISOString(),
      permissions: Object.freeze(["read_operations"] as const),
    });
    const headers = new Headers({
      [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: "20000000-0000-4000-8000-000000000002",
    });
    const correlation = journalAdminMutationCorrelation({
      requestHeaders: headers,
      scope,
      action: "statement_format_transitioned",
      targetKind: "statement_format",
      internalTargetId: "30000000-0000-4000-8000-000000000003",
    });
    expect(correlation).toMatch(/^[0-9a-f]{64}$/u);
    expect(journalAdminMutationCorrelation({
      requestHeaders: headers,
      scope,
      action: "statement_format_transitioned",
      targetKind: "statement_format",
      internalTargetId: "30000000-0000-4000-8000-000000000003",
    })).toBe(correlation);
    expect(journalAdminMutationCorrelation({
      requestHeaders: headers,
      scope,
      action: "statement_format_merged",
      targetKind: "statement_format",
      internalTargetId: "30000000-0000-4000-8000-000000000003",
    })).not.toBe(correlation);
    expect(() => journalAdminMutationCorrelation({
      requestHeaders: new Headers({ [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: "reused" }),
      scope,
      action: "statement_format_transitioned",
      targetKind: "statement_format",
      internalTargetId: "30000000-0000-4000-8000-000000000003",
    })).toThrowError("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  });

  it("accepts only an explicit same-origin admin mutation request", () => {
    expect(() => requireJournalAdminMutationRequest(mutationRequest())).not.toThrow();
    const invalidHeaders: HeadersInit[] = [
      { [JOURNAL_ADMIN_REQUEST_HEADER]: "0" },
      { "sec-fetch-site": "cross-site" },
      { origin: "https://example.com" },
    ];
    for (const headers of invalidHeaders) {
      expect(() => requireJournalAdminMutationRequest(
        mutationRequest(headers),
      )).toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }
  });

  it("returns private no-store response headers", () => {
    const headers = journalAdminPrivateHeaders({ "content-type": "application/json" });
    expect(headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(headers.get("pragma")).toBe("no-cache");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("vary")).toContain("Cookie");
  });

  it("bounds sensitive requests by user and keyed network evidence", () => {
    const headers = new Headers({
      host: "dashboard.traderslink.pro",
      "x-real-ip": "203.0.113.10",
    });
    for (let index = 0; index < 12; index += 1) {
      consumeJournalAdminRateLimit({
        category: "sensitive",
        environment: {
          NODE_ENV: "production",
          TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: SECRET,
        },
        headers,
        now: NOW,
        userId: USER_ID,
      });
    }
    expect(() => consumeJournalAdminRateLimit({
      category: "sensitive",
      environment: {
        NODE_ENV: "production",
        TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: SECRET,
      },
      headers,
      now: NOW,
      userId: USER_ID,
    })).toThrowError("TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED");
  });

  it("checks sensitive permissions independently from authentication", () => {
    const scope: JournalAdminScope = Object.freeze({
      userId: USER_ID,
      role: "journal_owner_admin",
      mode: "production_discord_owner",
      authorizedAtUtc: NOW().toISOString(),
      discordOwnerVerifiedAtUtc: NOW().toISOString(),
      permissions: Object.freeze(["read_operations"] as const),
    });
    expect(() => requireJournalAdminPermission(scope, "read_operations")).not.toThrow();
    expect(() => requireJournalAdminPermission(
      scope,
      "download_consented_sources",
    )).toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  });
});
