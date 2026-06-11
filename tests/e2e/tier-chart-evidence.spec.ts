import { expect, test, type Page } from "@playwright/test";

const activeTier =
  process.env.TRADER_INTELLIGENCE_TIER === "free_execution"
    ? "free_execution"
    : "chart_context";

const FREE_TIER_FORBIDDEN_PHRASES = [
  "Chart evidence checked",
  "Chart evidence ready",
  "REVIEWED WITH CHART DATA",
  "Trusted candles",
  "Entries Under Resistance",
  "Support-Based Entries",
  "chart-supported",
  "Entry had little support underneath",
  "support/resistance exit review",
  "Paid chart evidence",
  "Paid tier: this trade has saved candle and level evidence.",
  "Ticker-story chart evidence",
];

async function assertPageDoesNotContain(
  page: Page,
  phrases: readonly string[],
) {
  const bodyText = await page.locator("body").innerText();

  for (const phrase of phrases) {
    expect(bodyText, `unexpected free-tier chart claim: ${phrase}`).not.toContain(
      phrase,
    );
  }
}

test.describe("Trader Intelligence tier chart-evidence matrix", () => {
  test("free_execution tier keeps chart evidence out of end-user routes", async ({
    page,
  }) => {
    test.skip(
      activeTier !== "free_execution",
      "run with TRADER_INTELLIGENCE_TIER=free_execution",
    );

    await page.goto("/intelligence/analytics/chart-evidence?demo=sample");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByTestId("analytics-chart-evidence-tier-gate"),
    ).toBeVisible();
    await expect(
      page.getByTestId("analytics-chart-evidence-panel"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Trading Performance Dashboard" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Chart Evidence" }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Support/Resistance Exits",
    );
    await expect(page.locator("body")).not.toContainText("Volume Evidence");

    for (const path of [
      "/intelligence/analytics/behavior?demo=sample",
      "/intelligence/coach?demo=sample",
      "/intelligence/coach/details?demo=sample",
      "/intelligence/coach/behavior-sequence?demo=sample",
      "/intelligence/review",
    ]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await assertPageDoesNotContain(page, FREE_TIER_FORBIDDEN_PHRASES);
    }

    await page.goto("/intelligence/analytics/behavior?demo=sample");
    await expect(page.getByTestId("analytics-behavior-report")).toBeVisible();
    await expect(
      page.getByTestId("analytics-behavior-report"),
    ).not.toContainText("support/resistance");

    await page.goto("/intelligence/coach?demo=sample");
    await expect(page.locator("body")).toContainText(/execution evidence checked/i);
    await expect(page.locator("body")).toContainText("execution-supported");
  });

  test("chart_context tier exposes chart evidence surfaces without tier gates", async ({
    page,
  }) => {
    test.skip(
      activeTier !== "chart_context",
      "run with TRADER_INTELLIGENCE_TIER=chart_context",
    );

    await page.goto("/intelligence/analytics/chart-evidence?demo=sample");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("analytics-chart-evidence-panel")).toBeVisible();
    await expect(
      page.getByTestId("analytics-chart-evidence-tier-gate"),
    ).toHaveCount(0);
    await expect(page.getByTestId("analytics-chart-evidence-panel")).toContainText(
      "Chart Findings",
    );
    await expect(page.getByTestId("analytics-chart-evidence-panel")).toContainText(
      "Support/Resistance Exits",
    );

    await page.goto("/intelligence/analytics/behavior?demo=sample");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("analytics-behavior-report")).toBeVisible();
    await expect(page.getByTestId("analytics-behavior-report")).toContainText(
      "any attached chart-context evidence",
    );

    await page.goto("/intelligence/coach?demo=sample");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/chart evidence checked/i);
    await expect(page.locator("body")).toContainText("chart-supported");

    await page.goto("/intelligence/coach/details?demo=sample");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("coach-behavior-report")).toBeVisible();
    await expect(page.getByTestId("coach-behavior-report")).toContainText(
      "chart-supported",
    );
  });
});
