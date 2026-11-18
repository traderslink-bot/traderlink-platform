import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "../../src/modules/platform/contracts/platform-request-security";
import { renderLegacyFactsHarness } from "./level-analysis/component-renderer.cjs";
const ORIGIN = "https://127.0.0.1:3102";
const controlRoot = () => process.env.LEVEL_ANALYSIS_E2E_CONTROL_ROOT!;
import { expect, test, type Page } from "@playwright/test";
import deliveryFixture from "../../src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";

const UNSAFE_LEVEL_FACTS_PHRASES = [
  "raw payload",
  "rawpayload",
  "raw payload hash",
  "rawpayloadhash",
  "recommendation",
  "trade advice",
  "buy",
  "sell",
  "hold",
  "coaching",
  "coach",
  "grading",
  "trade grade",
  "p/l",
  "pnl",
  "giveback",
  "behavior score",
  "behavior scoring",
];

async function saveSeedTrade(page: Page, attemptRoot: string): Promise<{ id: string; symbol: string }> {
  const metadata = JSON.parse(readFileSync(join(attemptRoot, "metadata.json"), "utf8"));
  // Accepted replacement import UI; same four fills, now in its supported format.
  const csv = [
    "Statement,Header,Field Name,Field Value",
    'Statement,Data,Period,"June 1, 2026 - June 1, 2026"',
    "Account Information,Header,Field Name,Field Value",
    `Account Information,Data,Account,${metadata.sourceAccount}`,
    "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
    'Trades,Data,Order,Stocks,USD,DEVS,"2026-06-01, 11:55:00",60,10.00,-0.52,E2E-1',
    'Trades,Data,Order,Stocks,USD,DEVS,"2026-06-01, 11:59:00",40,10.10,-0.52,E2E-2',
    'Trades,Data,Order,Stocks,USD,DEVS,"2026-06-01, 12:02:00",-50,10.35,-0.52,E2E-3',
    'Trades,Data,Order,Stocks,USD,DEVS,"2026-06-01, 12:05:00",-50,10.45,-0.52,E2E-4',
    "Mark-to-Market Performance Summary,Header,Asset Category,Currency,Symbol,Prior Quantity,Current Quantity",
    "Mark-to-Market Performance Summary,Data,Stocks,USD,DEVS,0,0",
  ].join("\r\n");
  await page.goto("/intelligence/import-dry-run");
  await expect(page).toHaveURL(/\/imports\?mode=preview$/);
  await page.getByRole("textbox", { name: "Broker", exact: true }).fill("Interactive Brokers");
  await expect(page.getByRole("textbox", { name: "Broker", exact: true })).toHaveValue("Interactive Brokers");
  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(csv), mimeType: "text/csv", name: "level-analysis-seeded-devs.csv",
  });
  const previewResponse = page.waitForResponse(response => response.url().endsWith("/api/platform/journal/imports/preview") && response.request().method() === "POST");
  const committed = page.waitForResponse(response => response.url().endsWith("/api/platform/journal/imports/commit") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  const preview = await previewResponse;
  expect(preview.status()).toBe(200);
  expect((await preview.json()).preview).toMatchObject({ mappedExecutionCount: 4, canCommit: true });
  expect((await committed).status()).toBe(200);
  await expect(page.getByText("4 executions added to your Trade Tracker.", { exact: true })).toBeVisible();
  execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx",
    "tests/e2e/level-analysis/fixture-server.cjs", "trade", attemptRoot], { encoding: "utf8" });
  // Diagnostic stdout is not a data channel. The private result is run/account bound.
  const resultPath = join(attemptRoot, "trade-result.json"), stat = lstatSync(resultPath);
  expect(stat.isFile() && !stat.isSymbolicLink()).toBe(true);
  expect(stat.mode & 0o777).toBe(0o600);
  expect(stat.uid).toBe(process.getuid?.());
  const result = JSON.parse(readFileSync(resultPath, "utf8"));
  expect(result).toMatchObject({ protocol: "level-facts-trade-result-v1", runId: metadata.runId,
    workspaceId: metadata.scope.workspaceId, accountId: metadata.scope.activeAccountId,
    expectedAccountSelectionRef: metadata.expectedAccountSelectionRef,
    trade: { symbol: "DEVS", state: "ready_closed" } });
  expect(result.runId).toBe(process.env.LEVEL_ANALYSIS_E2E_RUN_ID);
  expect(result.trade.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const savedTrade = result.trade as { id: string; symbol: string };
  expect(savedTrade).toBeTruthy();
  expect(savedTrade.symbol).toBe("DEVS");
  const details = await page.request.get(`/api/platform/journal/trade-details?roundTripId=${savedTrade.id}`);
  expect(details.status()).toBe(200);
  expect(await details.json()).toMatchObject({ symbol: "DEVS" });
  return savedTrade;
}

async function seedAcceptedLevelFactsLink(page: Page, savedTradeId: string, attemptRoot: string) {
  const ingestResponse = await page.request.post("/api/level-analysis/deliveries", {
    data: {
      payload: deliveryFixture,
    },
    headers: { Origin: ORIGIN, "Sec-Fetch-Site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
  });
  expect(ingestResponse.status()).toBe(200);
  const ingestBody = await ingestResponse.json();
  expect(ingestBody).toMatchObject({
    status: "accepted",
    compactSummary: {
      provider: "ibkr",
    },
  });

  const linkResponse = await page.request.post("/api/level-analysis/trade-links", {
    data: {
      roundTripId: savedTradeId,
      expectedAccountSelectionRef: JSON.parse(readFileSync(join(attemptRoot, "metadata.json"), "utf8")).expectedAccountSelectionRef,
      provider: "ibkr",
    },
    headers: { Origin: ORIGIN, "Sec-Fetch-Site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
  });
  expect(linkResponse.status()).toBe(200);
  const linkBody = await linkResponse.json();
  expect(linkBody).toMatchObject({
    status: "linked",
    symbol: "DEVS",
    provider: "ibkr",
  });

  const factsResponse = await page.request.get(
    `/api/trades/${encodeURIComponent(savedTradeId)}/level-analysis/facts`,
  );
  expect(factsResponse.status()).toBe(200);
  const factsBody = await factsResponse.json();
  expect(factsBody).toMatchObject({
    availability: {
      availability: "attached",
      sourceKind: "packaged_review_delivery",
      fifteenMinuteContextOnlyStatus: "context_only",
    },
    display: {
      shouldShowFactsPanel: true,
    },
    attachedFacts: {
      symbol: "DEVS",
      densityMetricSummary: {
        classification: "dense_clustered",
      },
      candidateInventoryGapSummary: {
        overall: "no_gap",
      },
      cacheFingerprintSourceIntegrity: {
        mismatchCount: 0,
        prohibitedLanguageHitCount: 0,
      },
    },
  });
  return factsBody;
}

test.describe("current Journal contracts and preserved Level Facts component", () => {
  test("checks current app redirects and renders genuine facts in the labelled component harness", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    expect(testInfo.retry).toBeLessThan(2);
    const attemptRoot = testInfo.retry === 0 ? controlRoot() : join(controlRoot(), "retry-1");
    const state = JSON.parse(readFileSync(join(attemptRoot, "browser-state.json"), "utf8"));
    await page.context().addCookies(state.cookies);

    const savedTrade = await saveSeedTrade(page, attemptRoot);
    const facts = await seedAcceptedLevelFactsLink(page, savedTrade.id, attemptRoot);

    const pageResponse = await page.goto(
      `/intelligence/trades/${encodeURIComponent(savedTrade.id)}`,
    );
    expect(pageResponse?.headers()["cache-control"]).toContain("no-store");
    const varyTokens = (pageResponse?.headers().vary ?? "")
      .split(",")
      .map((token) => token.trim().toLowerCase());
    expect(varyTokens).toContain("cookie");
    expect(varyTokens).toContain("rsc");
    await expect(page).toHaveURL(/\/analytics\/execution$/);
    await expect(page.getByRole("heading", { name: "Trade Breakdown", exact: true })).toBeVisible();

    // This is component browser coverage, NOT a claim that current Journal renders it.
    await page.goto("about:blank");
    await page.setContent(renderLegacyFactsHarness(facts));
    await expect(page.getByRole("heading", { name: "Preserved Level Facts component — test harness", exact: true })).toBeVisible();
    await expect(page.getByTestId("trade-detail-level-facts-availability")).toContainText("Level facts attached");

    const panel = page.getByTestId("trade-detail-level-facts-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Level Facts");
    await expect(panel).toContainText("DEVS");
    await expect(panel).toContainText("packaged review delivery");
    await expect(panel).toContainText("dense_clustered");
    await expect(panel).toContainText("no_gap");
    await expect(panel).toContainText("context_only");
    await expect(panel).toContainText("0");

    const panelText = (await panel.innerText()).toLowerCase();
    for (const phrase of UNSAFE_LEVEL_FACTS_PHRASES) {
      expect(panelText, `Unsafe level-facts phrase surfaced: ${phrase}`).not.toContain(
        phrase,
      );
    }
  });
});
