import { describe, expect, it } from "vitest";
import { buildCommunityMenu, type CommunityNavigationSnapshot } from "@/app/(dashboard)/communities/community-navigation";

const base = "/communities/local-review";
function snapshot(options: { owner?: boolean; allowed?: boolean; capabilities?: CommunityNavigationSnapshot["viewer"]["capabilities"] } = {}): CommunityNavigationSnapshot {
  return { community: { communityId: "10000000-0000-4000-8000-000000000001", discordGuildId: "1559172784813514803", slug: "local-review", displayName: "Local review", status: "active", isOwner: options.owner ?? false, memberCount: 2 },
    viewer: { userId: "20000000-0000-4000-8000-000000000002", displayName: "Publisher", capabilities: options.capabilities ?? ["community.view"], discordRoleIds: [] }, relationships: [], sourceAlertPublishingAllowed: options.allowed };
}
function paths(items: ReturnType<typeof buildCommunityMenu>["items"]): string[] {
  return items.flatMap(item => "children" in item && item.children ? paths(item.children) : "href" in item && item.href ? [item.href] : []);
}
describe("Current explicit Shared publisher navigation", () => {
  it("adds only the source workspace for a Shared-only member", () => {
    const model = buildCommunityMenu(snapshot({ allowed: true }), base);
    expect(paths(model.items)).toEqual([base, `${base}/alerts`]);
    expect(model.items.find(item => item.label === "Shared alert publishing")).toMatchObject({ href: `${base}/alerts` });
  });
  it.each([false, undefined])("requires strict server true, including revoked/history/absent state %s", allowed => {
    expect(paths(buildCommunityMenu(snapshot({ allowed }), base).items)).toEqual([base]);
    expect(paths(buildCommunityMenu(snapshot({ allowed }), base, "shared-alerts").items)).toEqual([]);
  });
  it("preserves legacy publishing without inventing a Shared grant", () => {
    const model = buildCommunityMenu(snapshot({ capabilities: ["community.view", "community.alerts.create"] }), base);
    expect(paths(model.items)).toContain(`${base}/manage/alerts`);
    expect(paths(model.items)).not.toContain(`${base}/alerts`);
    expect(paths(model.items)).not.toContain(`${base}/manage/shared-alerts/source-channels`);
  });
  it("keeps assignment management owner-only and independent of an owner publishing grant", () => {
    const model = buildCommunityMenu(snapshot({ owner: true, allowed: false }), base, "shared-alerts");
    expect(paths(model.items)).toEqual([`${base}/manage/shared-alerts`, `${base}/manage/shared-alerts/source-channels`]);
    expect(paths(buildCommunityMenu(snapshot({ allowed: true }), base, "shared-alerts").items)).toEqual([`${base}/alerts`]);
  });
  it("does not mutate the supplied capability model or widen Stats/market access", () => {
    const current = snapshot({ allowed: true }), before = JSON.stringify(current);
    const menu = paths(buildCommunityMenu(current, base).items);
    expect(menu.some(path => path.includes("/stats") || path.endsWith("/alert") || path.includes("/manage"))).toBe(false);
    expect(JSON.stringify(current)).toBe(before);
  });
});
