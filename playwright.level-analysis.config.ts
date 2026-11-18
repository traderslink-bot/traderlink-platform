import { join } from "node:path";
import { homedir } from "node:os";
import { defineConfig } from "@playwright/test";

const githubRunId = [process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT]
  .filter(Boolean)
  .join("-");
const runId =
  process.env.LEVEL_ANALYSIS_E2E_RUN_ID ??
  (githubRunId.length > 0 ? githubRunId : `${Date.now()}-${process.pid}`);
const safeRunId = runId.replace(/[^A-Za-z0-9_.-]/g, "-") || "local";
const databaseDir = join(
  homedir(),
  ".trader-intelligence-e2e",
  "level-analysis",
  safeRunId,
);
const controlRoot = databaseDir;
process.env.NODE_DISABLE_COMPILE_CACHE = "1";
process.env.TSX_DISABLE_CACHE = "1";
process.env.LEVEL_ANALYSIS_E2E_CONTROL_ROOT = controlRoot;
process.env.LEVEL_ANALYSIS_E2E_RUN_ID = safeRunId;
// Match Next's real server-only package export in the native server bootstrap.
process.env.NODE_PATH = join(process.cwd(), "node_modules/next/dist/compiled");

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "artifacts/playwright-results/level-analysis",
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests/e2e",
  testMatch: /.*level-analysis-trade-detail-seeded-flow\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL: "https://127.0.0.1:3102",
    ignoreHTTPSErrors: true,
    storageState: join(controlRoot, "browser-state.json"),
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
  workers: 1,
  webServer: {
    command: "node --conditions=react-server --import tsx tests/e2e/level-analysis/fixture-server.cjs",
    env: {
      NODE_DISABLE_COMPILE_CACHE: "1",
      TSX_DISABLE_CACHE: "1",
      NODE_PATH: process.env.NODE_PATH,
      LEVEL_ANALYSIS_E2E_CONTROL_ROOT: controlRoot,
      LEVEL_ANALYSIS_E2E_RUN_ID: safeRunId,
    },
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 120_000,
    url: "https://127.0.0.1:3102/api/platform/health",
  },
});
