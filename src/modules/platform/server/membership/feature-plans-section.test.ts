import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PlanCatalog } from "@/app/plans/plan-catalog";
import { FeaturePlansSection } from "@/app/plans/feature-plans-section";
import { PublicWebsiteChrome } from "@/src/components/site/public-website-chrome";
import { NonEmbeddedServices } from "@/app/embedded-plans/non-embedded-services";
import type { PlatformMembershipCatalogPlan } from "./platform-membership-catalog-repository";

const catalog = vi.hoisted(() => ({ read: vi.fn(), available: true }));
vi.mock("./platform-membership-catalog-repository", () => ({
  PlatformMembershipCatalogRepository: class { readPublicPlans() { return catalog.read(); } },
}));
vi.mock("../database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, read: (database: object) => unknown) => {
    if (!catalog.available) throw new Error("Storage unavailable");
    return read({});
  },
}));
vi.mock("@/app/plans/checkout-actions", () => ({ selectMembershipAction: vi.fn(), selectEmbeddedMembershipAction: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/embedded-plans" }));
vi.mock("@/app/plans/pricing-site-chrome", () => ({
  PricingSiteChrome: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, createElement("nav"), children, createElement("footer")),
}));

const plan: PlatformMembershipCatalogPlan = {
  planId: "public-plan", planVersionId: "published-version", name: "Journal plan",
  description: "Review your trading", packageType: "plan", requiresDiscord: false,
  displayOnly: true, displayPrices: [], offers: [], features: [],
};

describe("Feature-page public plans section", () => {
  it("renders the current cards as a section without a second page frame", () => {
    catalog.available = true;
    catalog.read.mockReturnValue([plan]);
    const html = renderToStaticMarkup(createElement(FeaturePlansSection));
    expect(html).toMatch(/<section[^>]*aria-label="Plans"/);
    expect(html).toContain("Journal plan");
    expect(html).toMatch(/<h2[^>]*>Your Trading/);
    expect(html).toMatch(/<h3[^>]*>Journal plan/);
    expect(html).not.toMatch(/<(nav|footer|main|h1)(\s|>)/);
  });

  it("keeps standalone plans chrome and its original heading", () => {
    const html = renderToStaticMarkup(createElement(PlanCatalog, { plans: [plan] }));
    expect(html).toContain("<nav");
    expect(html).toContain("<footer");
    expect(html).toContain("<main");
    expect(html).toMatch(/<h1[^>]*>Your Trading/);
  });

  it("adds no global public-host chrome or browser services to the embedded route", () => {
    const html = renderToStaticMarkup(createElement(PublicWebsiteChrome, null,
      createElement(PlanCatalog, { plans: [plan], embedded: true }),
      createElement(NonEmbeddedServices, null, createElement("aside", null, "Cookie choices"))));
    expect(html).toContain("Journal plan");
    expect(html).not.toMatch(/<(nav|footer|header|aside)(\s|>)/);
    expect(html).not.toContain("Cookie choices");
  });

  it("leaves no empty pricing section or purchase prompt when there is no public base plan", () => {
    catalog.available = true;
    for (const plans of [[], [{ ...plan, packageType: "addon" }]]) {
      catalog.read.mockReturnValue(plans);
      expect(renderToStaticMarkup(createElement(FeaturePlansSection))).toBe("");
    }
  });

  it("fails closed when public catalog storage is unavailable", () => {
    catalog.available = false;
    try {
      expect(renderToStaticMarkup(createElement(FeaturePlansSection))).toBe("");
    } finally { catalog.available = true; }
  });
});
