// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const fixture = vi.hoisted(() => ({
  adapter: vi.fn(),
  close: vi.fn(),
  identity: vi.fn(),
  observe: vi.fn(),
  readonly: vi.fn(),
  sync: vi.fn(),
}));

vi.mock("@/src/modules/communities/server/community-owner-review-request-identity", () => ({
  requireCommunityOwnerReviewRequestIdentity: fixture.identity,
}));
vi.mock("@/src/modules/communities/server/community-discord-access-sync", () => ({
  readCommunityDiscordRefreshGuildIds: () => ["1559172784813514803"],
  observeCommunityDiscordAccess: fixture.observe,
  syncCommunityDiscordAccessEvidence: fixture.sync,
}));
const database = {
  close: fixture.close,
  prepare: () => ({ get: () => ({ auth_subject: "100000000000000001" }) }),
};
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: fixture.readonly,
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  openPlatformDatabase: () => database,
}));
vi.mock("@/src/modules/platform/server/privacy/platform-community-member-lifecycle-request", () => ({
  resolveCommunityMemberLifecycleConfiguration: () => ({ policyRef: "policy", profileRef: "profile" }),
  withAdmittedCommunityMemberRequest: fixture.adapter,
}));

import { POST } from "@/app/api/communities/discord-access/route";

describe("Community Discord access refresh route", () => {
  const request = () => new NextRequest("https://app.traderslink.pro/api/communities/discord-access", {
    method: "POST",
    headers: {
      host: "app.traderslink.pro",
      origin: "https://app.traderslink.pro",
      "sec-fetch-site": "same-origin",
      "x-traderlink-platform-mutation": "1",
    },
  });
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.identity.mockReturnValue({ scope: { userId: "10000000-0000-4000-8000-000000000001" } });
    fixture.readonly.mockImplementation((_options: unknown, operation: (db: typeof database) => unknown) => operation(database));
    fixture.observe.mockResolvedValue({
      observedAtUtc: "2026-11-19T16:00:00.000Z",
      guilds: [{ id: "1559172784813514803", name: "Tests", owner: true, permissions: "32" }],
      memberships: [{ guildId: "1559172784813514803" }],
    });
    fixture.sync.mockReturnValue({ candidates: 1, memberships: 1 });
    fixture.adapter.mockImplementation((input: { operation: (context: unknown) => unknown }) => input.operation({
      userId: "10000000-0000-4000-8000-000000000001",
      database,
      core: {},
    }));
  });

  it("observes Discord before entering the admitted synchronous writer", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "Community access refreshed." });
    expect(fixture.observe).toHaveBeenCalledWith({
      authSubject: "100000000000000001",
      botToken: "",
      guildIds: ["1559172784813514803"],
    });
    expect(fixture.observe.mock.invocationCallOrder[0]).toBeLessThan(fixture.adapter.mock.invocationCallOrder[0]);
    expect(fixture.sync).toHaveBeenCalledWith(database, expect.objectContaining({
      verifiedAtUtc: "2026-11-19T16:00:00.000Z",
    }));
    expect(fixture.close).toHaveBeenCalledTimes(1);
  });

  it("does not enter Core when Discord cannot verify an allowed guild", async () => {
    fixture.observe.mockResolvedValue({ observedAtUtc: "2026-11-19T16:00:00.000Z", guilds: [], memberships: [] });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(fixture.adapter).not.toHaveBeenCalled();
    expect(fixture.sync).not.toHaveBeenCalled();
  });

  it("rejects an unguarded request before identity, database or Discord work", async () => {
    const response = await POST(new NextRequest("https://app.traderslink.pro/api/communities/discord-access", { method: "POST" }));
    expect(response.status).toBe(503);
    expect(fixture.identity).not.toHaveBeenCalled();
    expect(fixture.readonly).not.toHaveBeenCalled();
    expect(fixture.observe).not.toHaveBeenCalled();
    expect(fixture.adapter).not.toHaveBeenCalled();
    expect(fixture.sync).not.toHaveBeenCalled();
  });
});
