import { describe, expect, it } from "vitest";
import { deriveJournalAccountSelectionRef } from "../../contracts/journal-account-selection";
import {
  currentJournalAccountSelectionRef,
  requireExpectedJournalAccountSelection,
} from "./journal-account-selection-authorization";

import {
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
  validateDevelopmentDashboardInboundRequest,
  validateDevelopmentDashboardRequest,
} from "./development-dashboard-network-boundary";

const token = "a".repeat(43);

function runtimeEnvironment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "development",
    [TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV]: "true",
    [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV]: "1",
    [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV]: token,
  };
}

function runtimeHeaders(): Headers {
  return new Headers({
    host: "127.0.0.1:3010",
    [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER]: token,
    "x-forwarded-host": "127.0.0.1:3010",
    "x-forwarded-for": "127.0.0.1",
    "x-forwarded-proto": "http",
    "x-forwarded-port": "3010",
  });
}

describe("development dashboard request boundary", () => {
  it("rejects stale and forged mutation selections without disclosing account IDs", () => {
    const workspaceId = "11111111-1111-4111-8111-111111111111";
    const accountA = "22222222-2222-4222-8222-222222222222";
    const accountB = "33333333-3333-4333-8333-333333333333";
    const scope = {
      userId: "44444444-4444-4444-8444-444444444444",
      workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: [accountA, accountB],
      activeAccountId: accountA,
    };
    const activeRef = deriveJournalAccountSelectionRef(workspaceId, accountA);
    expect(currentJournalAccountSelectionRef(scope)).toBe(activeRef);
    expect(requireExpectedJournalAccountSelection(scope, activeRef)).toBe(activeRef);
    expect(() => requireExpectedJournalAccountSelection(
      scope,
      deriveJournalAccountSelectionRef(workspaceId, accountB),
    )).toThrowError("TRADERLINK_ACCOUNT_SELECTION_CONFLICT");
    expect(() => requireExpectedJournalAccountSelection(scope, "f".repeat(64)))
      .toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });

  it("accepts only the exact launcher assertion and synthesized loopback forwarding", () => {
    expect(validateDevelopmentDashboardRequest(
      runtimeHeaders(),
      runtimeEnvironment(),
    )).toEqual({ ok: true, port: "3010" });
  });

  it("fails closed outside development and for missing assertions", () => {
    expect(validateDevelopmentDashboardRequest(runtimeHeaders(), {
      ...runtimeEnvironment(),
      NODE_ENV: "production",
    })).toMatchObject({ ok: false, code: "platform_local_dashboard_disabled" });
    const missing = runtimeHeaders();
    missing.delete(TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER);
    expect(validateDevelopmentDashboardRequest(
      missing,
      runtimeEnvironment(),
    )).toMatchObject({
      ok: false,
      code: "platform_local_dashboard_assertion_missing",
    });
  });

  it("rejects public hosts and proxy evidence", () => {
    const publicHost = runtimeHeaders();
    publicHost.set("host", "example.com");
    expect(validateDevelopmentDashboardRequest(
      publicHost,
      runtimeEnvironment(),
    )).toMatchObject({ ok: false, code: "platform_local_dashboard_host_invalid" });
    const proxy = runtimeHeaders();
    proxy.set("via", "proxy");
    expect(validateDevelopmentDashboardRequest(
      proxy,
      runtimeEnvironment(),
    )).toMatchObject({
      ok: false,
      code: "platform_local_dashboard_forwarding_invalid",
    });
  });

  it("allows a clean loopback inbound request and rejects supplied assertions", () => {
    expect(validateDevelopmentDashboardInboundRequest(new Headers({
      host: "localhost:3010",
    }))).toEqual({ ok: true, port: "3010" });
    expect(validateDevelopmentDashboardInboundRequest(new Headers({
      host: "127.0.0.1:3010",
      [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER]: token,
    }))).toMatchObject({
      ok: false,
      code: "platform_local_dashboard_forwarding_invalid",
    });
  });
});
