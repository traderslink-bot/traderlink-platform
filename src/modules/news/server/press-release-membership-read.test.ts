// @vitest-environment node
import type Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
const denied = vi.hoisted(() => new Error("membership_required"));
vi.mock("../../platform/server/membership/platform-membership-access", () => ({ assertMembershipFeature: () => { throw denied; } }));
import { PressReleaseDashboardRepository } from "./press-release-dashboard-repository";
it.each(["list","find","unreadCounts","markRead","markChannelRead"] as const)("denies %s before article queries", method => {
  const prepare = vi.fn((sql: string) => { void sql; return { get: () => ({ found: 1 }) }; });
  const repository = new PressReleaseDashboardRepository({ prepare } as unknown as Database.Database);
  const scope = { userId: "member", workspaceId: "workspace" } as WorkspaceAccessScope;
  expect(() => {
    if (method === "unreadCounts") return repository.unreadCounts(scope);
    if (method === "list") return repository.list({ scope, channel: "all" });
    if (method === "markChannelRead") return repository.markChannelRead({ scope, channel: "all", readAtUtc: "2026-10-16T12:00:00.000Z" });
    if (method === "find") return repository.find({ scope, articleId: "article", channel: "all" });
    return repository.markRead({ scope, articleId: "article", readAtUtc: "2026-10-16T12:00:00.000Z" });
  }).toThrow(denied);
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(prepare.mock.calls[0]?.[0]).not.toContain("news_articles");
});
