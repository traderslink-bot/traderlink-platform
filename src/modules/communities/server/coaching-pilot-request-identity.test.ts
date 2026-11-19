// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const adapters = vi.hoisted(() => ({
  userId: "owner-one",
  database: null as Database.Database | null,
}));

function identity() {
  return {
    mode: "platform_session",
    scope: { userId: adapters.userId },
  };
}

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformBillingRequestIdentity: () => identity(),
  requireTraderLinkPlatformPageIdentity: async () => identity(),
  requireTraderLinkPlatformAuthenticatedPageIdentity: async () => identity(),
  requireTraderLinkPlatformServerComponentPageIdentity: async () => identity(),
}));

vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, operation: (database: Database.Database) => unknown) =>
    operation(adapters.database!),
}));

import { requireCoachingPilotPageIdentity, requireCoachingPilotRequestIdentity } from "./coaching-pilot-request-identity";
import {
  requireCommunityOwnerReviewAuthenticatedPageIdentity,
  requireCommunityOwnerReviewPageIdentity,
  requireCommunityOwnerReviewRequestIdentity,
  requireCommunityOwnerReviewServerComponentPageIdentity,
} from "./community-owner-review-request-identity";

beforeEach(() => {
  vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", "101,202");
  const database = new Database(":memory:");
  adapters.database = database;
  database.exec(`CREATE TABLE platform_auth_identities (user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT);
INSERT INTO platform_auth_identities VALUES
('owner-one', 'discord', '101', 'active'),
('owner-two', 'discord', '202', 'active'),
('ordinary', 'discord', '303', 'active'),
('revoked', 'discord', '202', 'revoked');`);
});

afterEach(() => {
  adapters.database?.close();
  adapters.database = null;
  vi.unstubAllEnvs();
});

it.each(["owner-one", "owner-two"])("allows the configured Coaching account %s", async userId => {
  adapters.userId = userId;
  expect(requireCoachingPilotRequestIdentity(new Headers()).scope.userId).toBe(userId);
  await expect(requireCoachingPilotPageIdentity()).resolves.toMatchObject({ scope: { userId } });
});

it.each(["owner-one", "owner-two"])("allows the configured Community review account %s across human entry points", async userId => {
  adapters.userId = userId;
  expect(requireCommunityOwnerReviewRequestIdentity(new Headers()).scope.userId).toBe(userId);
  await expect(requireCommunityOwnerReviewPageIdentity()).resolves.toMatchObject({ scope: { userId } });
  await expect(requireCommunityOwnerReviewAuthenticatedPageIdentity()).resolves.toMatchObject({ scope: { userId } });
  await expect(requireCommunityOwnerReviewServerComponentPageIdentity()).resolves.toMatchObject({ scope: { userId } });
});

it.each(["ordinary", "revoked"])("rejects the Coaching request and action for %s", async userId => {
  adapters.userId = userId;
  expect(() => requireCoachingPilotRequestIdentity(new Headers())).toThrow();
  await expect(requireCoachingPilotPageIdentity()).rejects.toThrow();
});

it.each(["ordinary", "revoked"])("rejects Community human entry points for %s", async userId => {
  adapters.userId = userId;
  expect(() => requireCommunityOwnerReviewRequestIdentity(new Headers())).toThrow();
  await expect(requireCommunityOwnerReviewPageIdentity()).rejects.toThrow();
  await expect(requireCommunityOwnerReviewAuthenticatedPageIdentity()).rejects.toThrow();
  await expect(requireCommunityOwnerReviewServerComponentPageIdentity()).rejects.toThrow();
});

it("fails closed when the account list is missing", () => {
  adapters.userId = "owner-one";
  vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", undefined);
  expect(() => requireCoachingPilotRequestIdentity(new Headers())).toThrow();
});
