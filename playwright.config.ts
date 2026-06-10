import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "artifacts/playwright-results",
  reporter: [["list"]],
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
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
    {
      name: "chromium-tablet",
      use: {
        browserName: "chromium",
        viewport: {
          height: 1200,
          width: 900,
        },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        browserName: "chromium",
        isMobile: true,
        viewport: {
          height: 1200,
          width: 390,
        },
      },
    },
    {
      name: "firefox-smoke",
      testMatch: /.*app-first-user-hardening\.spec\.ts/,
      use: {
        browserName: "firefox",
        viewport: {
          height: 1200,
          width: 1440,
        },
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3100/intelligence/import-dry-run",
  },
});
