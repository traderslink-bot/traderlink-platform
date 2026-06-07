import { rmSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

const databaseDir = join(process.cwd(), "artifacts", "level-analysis-e2e");
const databasePath = join(databaseDir, "trade-detail-level-facts.sqlite");

rmSync(databaseDir, { recursive: true, force: true });

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "artifacts/playwright-results/level-analysis",
  reporter: [["list"]],
  testDir: "./tests/e2e",
  testMatch: /.*level-analysis-trade-detail-seeded-flow\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        browserName: "chromium",
        viewport: {
          height: 1200,
          width: 1440,
        },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    env: {
      ...process.env,
      LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED: "1",
      LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED: "1",
      TRADER_INTELLIGENCE_DB_PATH: databasePath,
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3101/import-dry-run",
  },
});
