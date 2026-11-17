// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const COMMUNITY_HUMAN_ENTRYPOINTS = [
  "app/(dashboard)/communities/[communitySlug]/recovery/page.tsx",
  "app/(dashboard)/communities/coaching/page.tsx",
  "app/(dashboard)/communities/community-dashboard-loader.ts",
  "app/(dashboard)/communities/community-installation-actions.ts",
  "app/(dashboard)/communities/community-management-actions.ts",
  "app/(dashboard)/communities/community-setup-feedback-actions.ts",
  "app/(dashboard)/communities/onboarding-actions.ts",
  "app/(dashboard)/communities/onboarding/page.tsx",
] as const;

it.each(COMMUNITY_HUMAN_ENTRYPOINTS)("keeps the owner review gate at %s", file => {
  const source = readFileSync(resolve(process.cwd(), file), "utf8");
  expect(source).toContain("community-owner-review-request-identity");
  expect(source).not.toMatch(/requireTraderLinkPlatform(?:Page|AuthenticatedPage|ServerComponentPage)Identity/u);
});

it("keeps all Coaching mutations behind the canonical Community gate adapter", () => {
  const actions = readFileSync(
    resolve(process.cwd(), "app/(dashboard)/communities/community-actions.ts"),
    "utf8",
  );
  const adapter = readFileSync(
    resolve(process.cwd(), "src/modules/communities/server/coaching-pilot-request-identity.ts"),
    "utf8",
  );
  expect(actions).toContain("requireCoachingPilotPageIdentity");
  expect(adapter).toContain("requireCommunityOwnerReviewPageIdentity");
  expect(adapter).toContain("requireCommunityOwnerReviewRequestIdentity");
});

it("hides Community navigation from identities outside the owner review gate", () => {
  const frame = readFileSync(resolve(process.cwd(), "app/dashboard-layout-frame.tsx"), "utf8");
  expect(frame).toContain("const watchlistAdminNavigationAccess = hasWatchlistDashboardNavigationAccess(identity)");
  expect(frame).toContain("communityNavigationHref: watchlistAdminNavigationAccess && firstCommunity");
});
