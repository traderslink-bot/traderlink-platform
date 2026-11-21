// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("@/src/lib/news/company-data-gateway", () => ({
  readCompanyData: async (kind: string) => kind === "profile"
    ? { name: "Company", finnhubIndustry: "Banking", currency: "USD", marketCapitalization: 10, logo: "https://static.finnhub.io/logo.png", weburl: "https://company.example" }
    : kind === "directory" ? {} : kind === "metrics" ? { metric: { beta: 1.2 } } : null,
}));
import { readCompanySnapshot } from "./company-snapshot";

it("keeps company profile information with neutral field names and without unused vendor asset URLs", async () => {
  const company = await readCompanySnapshot("BETA");
  expect(company.profile).toEqual({ name: "Company", industry: "Banking", currency: "USD", marketCapitalization: 10, weburl: "https://company.example" });
  expect(company.metrics).toEqual({ beta: 1.2 });
  expect(JSON.stringify(company)).not.toContain("finnhub");
});
